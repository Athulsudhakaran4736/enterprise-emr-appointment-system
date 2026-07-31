const AUDIT_ACTIONS = require("../constants/auditActions");
const APPOINTMENT_STATUSES = require("../constants/appointmentStatuses");
const ROLES = require("../constants/roles");

const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

const ApiError = require("../utils/ApiError");

const { createAuditLog } = require("./audit.service");
const patientService = require("./patient.service");
const slotService = require("./slot.service");

const populateAppointment = (query) => {
  return query
    .populate(
      "patient",
      "patientNumber name dateOfBirth gender mobile email address emergencyContact isActive",
    )
    .populate({
      path: "doctor",
      select:
        "user department specialization registrationNumber qualification consultationDuration isActive",
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
    .populate("department", "name code isActive")
    .populate("createdBy", "name email role")
    .populate("updatedBy", "name email role")
    .populate("arrivedBy", "name email role")
    .populate("cancelledBy", "name email role");
};

const throwSlotConflict = () => {
  throw new ApiError(409, "The selected appointment slot is already booked");
};

const findAvailableSlot = async ({ doctorId, appointmentDate, startTime }) => {
  const slotResult = await slotService.getDoctorSlots({
    doctorId,
    date: appointmentDate,
  });

  const slot = slotResult.data.slots.find(
    (currentSlot) => currentSlot.startTime === startTime,
  );

  if (!slot) {
    throw new ApiError(
      400,
      "The selected time is not a valid appointment slot",
    );
  }

  if (slot.status !== "AVAILABLE") {
    throwSlotConflict();
  }

  return {
    slot,
    departmentId: slotResult.data.department.id,
  };
};

const resolvePatient = async ({
  patientId,
  newPatient,
  createdBy,
  actorRole,
  ipAddress,
  userAgent,
}) => {
  if (patientId) {
    const patient = await Patient.findOne({
      _id: patientId,
      isActive: true,
    });

    if (!patient) {
      throw new ApiError(404, "Active patient not found");
    }

    return patient;
  }

  const normalizedEmergencyContact = {
    name: newPatient.emergencyContact?.name?.trim() || "",
    relationship: newPatient.emergencyContact?.relationship?.trim() || "",
    mobile: String(newPatient.emergencyContact?.mobile || "").replace(
      /\D/g,
      "",
    ),
  };

  return patientService.createPatient({
    name: newPatient.name,
    dateOfBirth: newPatient.dateOfBirth,
    gender: newPatient.gender,
    mobile: String(newPatient.mobile).replace(/\D/g, ""),
    email: newPatient.email,
    address: newPatient.address,
    emergencyContact: normalizedEmergencyContact,
    createdBy,
    actorRole,
    ipAddress,
    userAgent,
  });
};

const createAppointment = async ({
  patientId,
  newPatient,
  doctorId,
  appointmentDate,
  startTime,
  reasonForVisit,
  notes,
  createdBy,
  actorRole,
  ipAddress,
  userAgent,
}) => {
  /*
   * First perform an application-level availability check.
   *
   * The database unique index remains the final concurrency
   * protection in case another request books the slot between
   * this check and the create operation.
   */
  const { slot, departmentId } = await findAvailableSlot({
    doctorId,
    appointmentDate,
    startTime,
  });

  const patient = await resolvePatient({
    patientId,
    newPatient,
    createdBy,
    actorRole,
    ipAddress,
    userAgent,
  });

  let appointment;

  try {
    appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctorId,
      department: departmentId,
      appointmentDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: APPOINTMENT_STATUSES.SCHEDULED,
      isActiveBooking: true,
      reasonForVisit: reasonForVisit?.trim() || "",
      notes: notes?.trim() || "",
      createdBy,
    });
  } catch (error) {
    if (error.code === 11000) {
      throwSlotConflict();
    }

    throw error;
  }

  await createAuditLog({
    user: createdBy,
    role: actorRole,
    action: AUDIT_ACTIONS.APPOINTMENT_CREATED,
    entityType: "Appointment",
    entityId: appointment._id,
    metadata: {
      patient: patient._id,
      doctor: doctorId,
      department: departmentId,
      appointmentDate,
      startTime: slot.startTime,
    },
    ipAddress,
    userAgent,
  });

  return populateAppointment(Appointment.findById(appointment._id));
};

const getDoctorProfileForUser = async (userId) => {
  const doctor = await Doctor.findOne({
    user: userId,
    isActive: true,
  }).select("_id");

  if (!doctor) {
    throw new ApiError(403, "Doctor profile not found for this user");
  }

  return doctor;
};

const buildActorFilter = async ({ actorUserId, actorRole }) => {
  if (actorRole !== ROLES.DOCTOR) {
    return {};
  }

  const doctor = await getDoctorProfileForUser(actorUserId);

  return {
    doctor: doctor._id,
  };
};

const getAppointments = async ({
  doctor,
  department,
  patient,
  status,
  date,
  dateFrom,
  dateTo,
  page = 1,
  limit = 20,
  actorUserId,
  actorRole,
}) => {
  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw new ApiError(422, "dateTo cannot be earlier than dateFrom");
  }

  const filter = await buildActorFilter({
    actorUserId,
    actorRole,
  });

  /*
   * A doctor is restricted to their own appointments.
   * Super Admin and Receptionist can use the doctor filter.
   */
  if (actorRole !== ROLES.DOCTOR && doctor) {
    filter.doctor = doctor;
  }

  if (department) {
    filter.department = department;
  }

  if (patient) {
    filter.patient = patient;
  }

  if (status) {
    filter.status = status;
  }

  if (date) {
    filter.appointmentDate = date;
  } else if (dateFrom || dateTo) {
    filter.appointmentDate = {};

    if (dateFrom) {
      filter.appointmentDate.$gte = dateFrom;
    }

    if (dateTo) {
      filter.appointmentDate.$lte = dateTo;
    }
  }

  const skip = (page - 1) * limit;

  const [appointments, totalItems] = await Promise.all([
    populateAppointment(
      Appointment.find(filter)
        .sort({
          appointmentDate: -1,
          startTime: 1,
        })
        .skip(skip)
        .limit(limit),
    ).lean(),

    Appointment.countDocuments(filter),
  ]);

  return {
    appointments,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit),
    },
  };
};

const getAppointmentById = async ({
  appointmentId,
  actorUserId,
  actorRole,
}) => {
  const filter = {
    _id: appointmentId,
  };

  if (actorRole === ROLES.DOCTOR) {
    const doctor = await getDoctorProfileForUser(actorUserId);

    filter.doctor = doctor._id;
  }

  const appointment = await populateAppointment(Appointment.findOne(filter));

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  return appointment;
};

const updateAppointment = async ({
  appointmentId,
  updates,
  updatedBy,
  actorRole,
  ipAddress,
  userAgent,
}) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (
    appointment.status === APPOINTMENT_STATUSES.CANCELLED ||
    appointment.status === APPOINTMENT_STATUSES.COMPLETED
  ) {
    throw new ApiError(
      400,
      `${appointment.status} appointments cannot be edited`,
    );
  }

  const targetDoctorId = updates.doctorId || appointment.doctor.toString();

  const targetDate = updates.appointmentDate || appointment.appointmentDate;

  const targetStartTime = updates.startTime || appointment.startTime;

  const scheduleChanged =
    targetDoctorId !== appointment.doctor.toString() ||
    targetDate !== appointment.appointmentDate ||
    targetStartTime !== appointment.startTime;

  if (
    scheduleChanged &&
    appointment.status !== APPOINTMENT_STATUSES.SCHEDULED
  ) {
    throw new ApiError(400, "Only scheduled appointments can be rescheduled");
  }

  if (scheduleChanged) {
    const { slot, departmentId } = await findAvailableSlot({
      doctorId: targetDoctorId,
      appointmentDate: targetDate,
      startTime: targetStartTime,
    });

    appointment.doctor = targetDoctorId;
    appointment.department = departmentId;
    appointment.appointmentDate = targetDate;
    appointment.startTime = slot.startTime;
    appointment.endTime = slot.endTime;
  }

  if (updates.reasonForVisit !== undefined) {
    appointment.reasonForVisit = updates.reasonForVisit.trim();
  }

  if (updates.notes !== undefined) {
    appointment.notes = updates.notes.trim();
  }

  appointment.updatedBy = updatedBy;

  try {
    await appointment.save();
  } catch (error) {
    if (error.code === 11000) {
      throwSlotConflict();
    }

    throw error;
  }

  await createAuditLog({
    user: updatedBy,
    role: actorRole,
    action: AUDIT_ACTIONS.APPOINTMENT_UPDATED,
    entityType: "Appointment",
    entityId: appointment._id,
    metadata: {
      updatedFields: Object.keys(updates),
      doctor: appointment.doctor,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
    },
    ipAddress,
    userAgent,
  });

  return populateAppointment(Appointment.findById(appointment._id));
};

const cancelAppointment = async ({
  appointmentId,
  cancellationReason,
  cancelledBy,
  actorRole,
  ipAddress,
  userAgent,
}) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (appointment.status === APPOINTMENT_STATUSES.CANCELLED) {
    throw new ApiError(400, "Appointment is already cancelled");
  }

  if (appointment.status === APPOINTMENT_STATUSES.COMPLETED) {
    throw new ApiError(400, "Completed appointments cannot be cancelled");
  }

  appointment.status = APPOINTMENT_STATUSES.CANCELLED;

  appointment.isActiveBooking = false;
  appointment.cancelledAt = new Date();
  appointment.cancelledBy = cancelledBy;
  appointment.cancellationReason = cancellationReason.trim();
  appointment.updatedBy = cancelledBy;

  await appointment.save();

  await createAuditLog({
    user: cancelledBy,
    role: actorRole,
    action: AUDIT_ACTIONS.APPOINTMENT_CANCELLED,
    entityType: "Appointment",
    entityId: appointment._id,
    metadata: {
      doctor: appointment.doctor,
      patient: appointment.patient,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      cancellationReason: appointment.cancellationReason,
    },
    ipAddress,
    userAgent,
  });

  return populateAppointment(Appointment.findById(appointment._id));
};

const markPatientArrived = async ({
  appointmentId,
  arrivedBy,
  actorRole,
  ipAddress,
  userAgent,
}) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new ApiError(404, "Appointment not found");
  }

  if (appointment.status !== APPOINTMENT_STATUSES.SCHEDULED) {
    throw new ApiError(
      400,
      "Only scheduled appointments can be marked as arrived",
    );
  }

  appointment.status = APPOINTMENT_STATUSES.ARRIVED;

  appointment.arrivedAt = new Date();
  appointment.arrivedBy = arrivedBy;
  appointment.updatedBy = arrivedBy;

  /*
   * ARRIVED remains an active booking because the slot
   * must remain occupied.
   */
  appointment.isActiveBooking = true;

  await appointment.save();

  await createAuditLog({
    user: arrivedBy,
    role: actorRole,
    action: AUDIT_ACTIONS.PATIENT_ARRIVED,
    entityType: "Appointment",
    entityId: appointment._id,
    metadata: {
      doctor: appointment.doctor,
      patient: appointment.patient,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      arrivedAt: appointment.arrivedAt,
    },
    ipAddress,
    userAgent,
  });

  return populateAppointment(Appointment.findById(appointment._id));
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  markPatientArrived,
};
