const { DateTime } = require("luxon");

const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const ApiError = require("../utils/ApiError");
const scheduleService = require("./schedule.service");

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}`;
};

const slotOverlapsBreak = ({ slotStart, slotEnd, breaks }) => {
  return breaks.some((breakPeriod) => {
    const breakStart = timeToMinutes(breakPeriod.startTime);

    const breakEnd = timeToMinutes(breakPeriod.endTime);

    return slotStart < breakEnd && slotEnd > breakStart;
  });
};

const generateSlotsForSession = ({
  session,
  slotDurationMinutes,
  selectedDate,
  now,
  isToday,
}) => {
  const slots = [];

  const sessionStart = timeToMinutes(session.startTime);
  const sessionEnd = timeToMinutes(session.endTime);
  const breaks = session.breaks || [];

  for (
    let slotStart = sessionStart;
    slotStart + slotDurationMinutes <= sessionEnd;
    slotStart += slotDurationMinutes
  ) {
    const slotEnd = slotStart + slotDurationMinutes;

    if (
      slotOverlapsBreak({
        slotStart,
        slotEnd,
        breaks,
      })
    ) {
      continue;
    }

    const slotStartDateTime = selectedDate.plus({
      minutes: slotStart,
    });

    if (isToday && slotStartDateTime.toMillis() <= now.toMillis()) {
      continue;
    }

    slots.push({
      startTime: minutesToTime(slotStart),
      endTime: minutesToTime(slotEnd),
      status: "AVAILABLE",
    });
  }

  return slots;
};

const getDoctorSlots = async ({ doctorId, date }) => {
  const doctor = await Doctor.findOne({
    _id: doctorId,
    isActive: true,
  })
    .populate("user", "name email isActive")
    .populate("department", "name code isActive")
    .lean();

  if (!doctor || !doctor.user?.isActive) {
    throw new ApiError(404, "Active doctor not found");
  }

  if (!doctor.department || doctor.department.isActive === false) {
    throw new ApiError(400, "Doctor belongs to an inactive department");
  }

  const schedule = await scheduleService.getActiveScheduleForDate({
    doctorId,
    date,
  });

  if (!schedule) {
    throw new ApiError(404, "No active doctor schedule found for this date");
  }

  const selectedDate = DateTime.fromISO(date, {
    zone: schedule.timezone,
  }).startOf("day");

  if (!selectedDate.isValid || selectedDate.toISODate() !== date) {
    throw new ApiError(400, "Date must be a valid date in YYYY-MM-DD format");
  }

  const now = DateTime.now().setZone(schedule.timezone);
  const today = now.startOf("day");

  if (selectedDate.toMillis() < today.toMillis()) {
    throw new ApiError(400, "Slots cannot be generated for a past date");
  }

  // Luxon: Monday = 1 and Sunday = 7.
  // Our project: Sunday = 0 and Monday = 1.
  const dayOfWeek = selectedDate.weekday % 7;

  const workingDay = schedule.workingDays.find(
    (day) => day.dayOfWeek === dayOfWeek,
  );

  if (!workingDay || !workingDay.isWorking) {
    return {
      data: {
        doctor: {
          id: doctor._id.toString(),
          name: doctor.user.name,
        },
        department: {
          id: doctor.department._id.toString(),
          name: doctor.department.name,
          code: doctor.department.code,
        },
        date,
        timezone: schedule.timezone,
        slotDurationMinutes: schedule.slotDurationMinutes,
        slots: [],
      },
      meta: {
        totalSlots: 0,
        availableSlots: 0,
        bookedSlots: 0,
      },
    };
  }

  const isToday = selectedDate.toISODate() === now.toISODate();

  const slots = workingDay.sessions.flatMap((session) =>
    generateSlotsForSession({
      session,
      slotDurationMinutes: schedule.slotDurationMinutes,
      selectedDate,
      now,
      isToday,
    }),
  );

  slots.sort((firstSlot, secondSlot) =>
    firstSlot.startTime.localeCompare(secondSlot.startTime),
  );

  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: date,
    isActiveBooking: true,
  })
    .select("startTime")
    .lean();

  const bookedStartTimes = new Set(
    bookedAppointments.map((appointment) => appointment.startTime),
  );

  const slotsWithStatus = slots.map((slot) => ({
    ...slot,
    status: bookedStartTimes.has(slot.startTime) ? "BOOKED" : "AVAILABLE",
  }));

  const bookedSlots = slotsWithStatus.filter(
    (slot) => slot.status === "BOOKED",
  ).length;

  const availableSlots = slotsWithStatus.length - bookedSlots;

  return {
    data: {
      doctor: {
        id: doctor._id.toString(),
        name: doctor.user.name,
      },
      department: {
        id: doctor.department._id.toString(),
        name: doctor.department.name,
        code: doctor.department.code,
      },
      date,
      timezone: schedule.timezone,
      slotDurationMinutes: schedule.slotDurationMinutes,
      slots: slotsWithStatus,
    },
    meta: {
      totalSlots: slotsWithStatus.length,
      availableSlots,
      bookedSlots,
    },
  };
};

module.exports = {
  getDoctorSlots,
};
