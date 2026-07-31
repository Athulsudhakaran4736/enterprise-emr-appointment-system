const { DateTime, IANAZone } = require("luxon");

const AUDIT_ACTIONS = require("../constants/auditActions");
const Doctor = require("../models/Doctor");
const DoctorSchedule = require("../models/DoctorSchedule");
const ApiError = require("../utils/ApiError");
const { createAuditLog } = require("./audit.service");

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const hasOwn = (object, property) =>
  Object.prototype.hasOwnProperty.call(object, property);

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const validateTime = (time, fieldName) => {
  if (!TIME_PATTERN.test(time)) {
    throw new ApiError(422, `${fieldName} must use valid HH:mm format`);
  }
};

const validateDate = (date, timezone, fieldName) => {
  const parsedDate = DateTime.fromISO(date, {
    zone: timezone,
  });

  if (!parsedDate.isValid || parsedDate.toISODate() !== date) {
    throw new ApiError(
      422,
      `${fieldName} must be a valid date in YYYY-MM-DD format`,
    );
  }
};

const validateScheduleConfiguration = ({
  workingDays,
  slotDurationMinutes,
  timezone,
  effectiveFrom,
  effectiveTo,
}) => {
  if (!IANAZone.isValidZone(timezone)) {
    throw new ApiError(422, "Timezone must be a valid IANA timezone");
  }

  validateDate(effectiveFrom, timezone, "effectiveFrom");

  if (effectiveTo !== null && effectiveTo !== undefined) {
    validateDate(effectiveTo, timezone, "effectiveTo");

    if (effectiveTo < effectiveFrom) {
      throw new ApiError(
        422,
        "effectiveTo cannot be earlier than effectiveFrom",
      );
    }
  }

  if (
    !Number.isInteger(slotDurationMinutes) ||
    slotDurationMinutes < 5 ||
    slotDurationMinutes > 180
  ) {
    throw new ApiError(422, "Slot duration must be between 5 and 180 minutes");
  }

  if (!Array.isArray(workingDays) || workingDays.length === 0) {
    throw new ApiError(422, "At least one working day is required");
  }

  const dayNumbers = new Set();

  workingDays.forEach((workingDay) => {
    const { dayOfWeek, isWorking, sessions = [] } = workingDay;

    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new ApiError(422, "dayOfWeek must be between 0 and 6");
    }

    if (dayNumbers.has(dayOfWeek)) {
      throw new ApiError(
        422,
        `Duplicate working day found for day ${dayOfWeek}`,
      );
    }

    dayNumbers.add(dayOfWeek);

    if (!isWorking) {
      if (sessions.length > 0) {
        throw new ApiError(
          422,
          `Non-working day ${dayOfWeek} cannot contain sessions`,
        );
      }

      return;
    }

    if (!Array.isArray(sessions) || sessions.length === 0) {
      throw new ApiError(
        422,
        `Working day ${dayOfWeek} must contain at least one session`,
      );
    }

    const normalizedSessions = sessions
      .map((session) => {
        validateTime(
          session.startTime,
          `Session start time for day ${dayOfWeek}`,
        );

        validateTime(session.endTime, `Session end time for day ${dayOfWeek}`);

        const startMinutes = timeToMinutes(session.startTime);
        const endMinutes = timeToMinutes(session.endTime);

        if (startMinutes >= endMinutes) {
          throw new ApiError(
            422,
            `Session start time must be before end time for day ${dayOfWeek}`,
          );
        }

        if (endMinutes - startMinutes < slotDurationMinutes) {
          throw new ApiError(
            422,
            `Session on day ${dayOfWeek} must be long enough for at least one slot`,
          );
        }

        const breaks = session.breaks || [];

        const normalizedBreaks = breaks
          .map((breakPeriod) => {
            validateTime(
              breakPeriod.startTime,
              `Break start time for day ${dayOfWeek}`,
            );

            validateTime(
              breakPeriod.endTime,
              `Break end time for day ${dayOfWeek}`,
            );

            const breakStart = timeToMinutes(breakPeriod.startTime);

            const breakEnd = timeToMinutes(breakPeriod.endTime);

            if (breakStart >= breakEnd) {
              throw new ApiError(
                422,
                `Break start time must be before end time for day ${dayOfWeek}`,
              );
            }

            if (breakStart < startMinutes || breakEnd > endMinutes) {
              throw new ApiError(
                422,
                `Break must remain inside its session for day ${dayOfWeek}`,
              );
            }

            return {
              startMinutes: breakStart,
              endMinutes: breakEnd,
            };
          })
          .sort(
            (firstBreak, secondBreak) =>
              firstBreak.startMinutes - secondBreak.startMinutes,
          );

        for (
          let breakIndex = 1;
          breakIndex < normalizedBreaks.length;
          breakIndex += 1
        ) {
          const previousBreak = normalizedBreaks[breakIndex - 1];

          const currentBreak = normalizedBreaks[breakIndex];

          if (currentBreak.startMinutes < previousBreak.endMinutes) {
            throw new ApiError(
              422,
              `Break periods overlap for day ${dayOfWeek}`,
            );
          }
        }

        return {
          startMinutes,
          endMinutes,
        };
      })
      .sort(
        (firstSession, secondSession) =>
          firstSession.startMinutes - secondSession.startMinutes,
      );

    for (
      let sessionIndex = 1;
      sessionIndex < normalizedSessions.length;
      sessionIndex += 1
    ) {
      const previousSession = normalizedSessions[sessionIndex - 1];

      const currentSession = normalizedSessions[sessionIndex];

      if (currentSession.startMinutes < previousSession.endMinutes) {
        throw new ApiError(422, `Sessions overlap for day ${dayOfWeek}`);
      }
    }
  });
};

const ensureDoctorExists = async (doctorId) => {
  const doctor = await Doctor.findById(doctorId).populate(
    "user",
    "name email isActive",
  );

  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  if (!doctor.isActive || !doctor.user?.isActive) {
    throw new ApiError(400, "Doctor is inactive");
  }

  return doctor;
};

const findOverlappingSchedule = async ({
  doctorId,
  effectiveFrom,
  effectiveTo,
  excludeScheduleId,
}) => {
  const filter = {
    doctor: doctorId,
    isActive: true,
    $or: [
      {
        effectiveTo: null,
      },
      {
        effectiveTo: {
          $gte: effectiveFrom,
        },
      },
    ],
  };

  if (effectiveTo) {
    filter.effectiveFrom = {
      $lte: effectiveTo,
    };
  }

  if (excludeScheduleId) {
    filter._id = {
      $ne: excludeScheduleId,
    };
  }

  return DoctorSchedule.findOne(filter);
};

const populateSchedule = (query) => {
  return query
    .populate({
      path: "doctor",
      select: "user department specialization registrationNumber isActive",
      populate: [
        {
          path: "user",
          select: "name email isActive",
        },
        {
          path: "department",
          select: "name code isActive",
        },
      ],
    })
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");
};

const createSchedule = async ({
  doctor,
  workingDays,
  slotDurationMinutes,
  timezone,
  effectiveFrom,
  effectiveTo,
  isActive,
  createdBy,
  actorRole,
  ipAddress,
  userAgent,
}) => {
  await ensureDoctorExists(doctor);

  const activeStatus = isActive === undefined ? true : isActive;

  validateScheduleConfiguration({
    workingDays,
    slotDurationMinutes,
    timezone,
    effectiveFrom,
    effectiveTo,
  });

  if (activeStatus) {
    const overlappingSchedule = await findOverlappingSchedule({
      doctorId: doctor,
      effectiveFrom,
      effectiveTo,
    });

    if (overlappingSchedule) {
      throw new ApiError(
        409,
        "An active schedule already covers part of this date range",
      );
    }
  }

  const schedule = await DoctorSchedule.create({
    doctor,
    workingDays,
    slotDurationMinutes,
    timezone,
    effectiveFrom,
    effectiveTo: effectiveTo || null,
    isActive: activeStatus,
    createdBy,
  });

  await createAuditLog({
    user: createdBy,
    role: actorRole,
    action: AUDIT_ACTIONS.SCHEDULE_CREATED,
    entityType: "DoctorSchedule",
    entityId: schedule._id,
    metadata: {
      doctor,
      effectiveFrom,
      effectiveTo: effectiveTo || null,
    },
    ipAddress,
    userAgent,
  });

  return populateSchedule(DoctorSchedule.findById(schedule._id));
};

const getDoctorSchedules = async ({ doctorId, includeInactive }) => {
  const doctorExists = await Doctor.exists({
    _id: doctorId,
  });

  if (!doctorExists) {
    throw new ApiError(404, "Doctor not found");
  }

  const filter = {
    doctor: doctorId,
  };

  if (!includeInactive) {
    filter.isActive = true;
  }

  return populateSchedule(
    DoctorSchedule.find(filter).sort({
      effectiveFrom: -1,
      createdAt: -1,
    }),
  ).lean();
};

const getScheduleById = async ({ scheduleId, includeInactive }) => {
  const filter = {
    _id: scheduleId,
  };

  if (!includeInactive) {
    filter.isActive = true;
  }

  const schedule = await populateSchedule(DoctorSchedule.findOne(filter));

  if (!schedule) {
    throw new ApiError(404, "Schedule not found");
  }

  return schedule;
};

const updateSchedule = async ({
  scheduleId,
  updates,
  updatedBy,
  actorRole,
  ipAddress,
  userAgent,
}) => {
  const schedule = await DoctorSchedule.findById(scheduleId);

  if (!schedule) {
    throw new ApiError(404, "Schedule not found");
  }

  const mergedSchedule = {
    workingDays:
      updates.workingDays ??
      schedule.workingDays.map((workingDay) => workingDay.toObject()),

    slotDurationMinutes:
      updates.slotDurationMinutes ?? schedule.slotDurationMinutes,

    timezone: updates.timezone ?? schedule.timezone,

    effectiveFrom: updates.effectiveFrom ?? schedule.effectiveFrom,

    effectiveTo: hasOwn(updates, "effectiveTo")
      ? updates.effectiveTo
      : schedule.effectiveTo,

    isActive: hasOwn(updates, "isActive")
      ? updates.isActive
      : schedule.isActive,
  };

  validateScheduleConfiguration({
    workingDays: mergedSchedule.workingDays,
    slotDurationMinutes: mergedSchedule.slotDurationMinutes,
    timezone: mergedSchedule.timezone,
    effectiveFrom: mergedSchedule.effectiveFrom,
    effectiveTo: mergedSchedule.effectiveTo,
  });

  if (mergedSchedule.isActive) {
    const overlappingSchedule = await findOverlappingSchedule({
      doctorId: schedule.doctor,
      effectiveFrom: mergedSchedule.effectiveFrom,
      effectiveTo: mergedSchedule.effectiveTo,
      excludeScheduleId: scheduleId,
    });

    if (overlappingSchedule) {
      throw new ApiError(
        409,
        "Another active schedule overlaps this date range",
      );
    }
  }

  const allowedFields = [
    "workingDays",
    "slotDurationMinutes",
    "timezone",
    "effectiveFrom",
    "effectiveTo",
    "isActive",
  ];

  allowedFields.forEach((field) => {
    if (hasOwn(updates, field)) {
      schedule[field] =
        field === "effectiveTo" ? updates[field] || null : updates[field];
    }
  });

  schedule.updatedBy = updatedBy;

  await schedule.save();

  await createAuditLog({
    user: updatedBy,
    role: actorRole,
    action: AUDIT_ACTIONS.SCHEDULE_UPDATED,
    entityType: "DoctorSchedule",
    entityId: schedule._id,
    metadata: {
      updatedFields: Object.keys(updates),
    },
    ipAddress,
    userAgent,
  });

  return populateSchedule(DoctorSchedule.findById(schedule._id));
};

const deactivateSchedule = async ({
  scheduleId,
  updatedBy,
  actorRole,
  ipAddress,
  userAgent,
}) => {
  const schedule = await DoctorSchedule.findById(scheduleId);

  if (!schedule) {
    throw new ApiError(404, "Schedule not found");
  }

  schedule.isActive = false;
  schedule.updatedBy = updatedBy;

  await schedule.save();

  await createAuditLog({
    user: updatedBy,
    role: actorRole,
    action: AUDIT_ACTIONS.SCHEDULE_DEACTIVATED,
    entityType: "DoctorSchedule",
    entityId: schedule._id,
    metadata: {
      doctor: schedule.doctor,
    },
    ipAddress,
    userAgent,
  });

  return schedule;
};

const getActiveScheduleForDate = async ({ doctorId, date }) => {
  return DoctorSchedule.findOne({
    doctor: doctorId,
    isActive: true,
    effectiveFrom: {
      $lte: date,
    },
    $or: [
      {
        effectiveTo: null,
      },
      {
        effectiveTo: {
          $gte: date,
        },
      },
    ],
  })
    .sort({
      effectiveFrom: -1,
    })
    .lean();
};

module.exports = {
  createSchedule,
  getDoctorSchedules,
  getScheduleById,
  updateSchedule,
  deactivateSchedule,
  getActiveScheduleForDate,
};

