const appointmentService = require("../services/appointment.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");

const getRequestInformation = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get("user-agent") || null,
});

const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.createAppointment({
    patientId: req.body.patientId,
    newPatient: req.body.patient,
    doctorId: req.body.doctorId,
    appointmentDate: req.body.appointmentDate,
    startTime: req.body.startTime,
    reasonForVisit: req.body.reasonForVisit,
    notes: req.body.notes,
    createdBy: req.user._id,
    actorRole: req.user.role,
    ...getRequestInformation(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Appointment booked successfully",
    data: {
      appointment,
    },
  });
});

const getAppointments = asyncHandler(async (req, res) => {
  const result = await appointmentService.getAppointments({
    doctor: req.query.doctor,
    department: req.query.department,
    patient: req.query.patient,
    status: req.query.status,
    date: req.query.date,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    actorUserId: req.user._id,
    actorRole: req.user.role,
  });

  return sendSuccess(res, {
    message: "Appointments retrieved successfully",
    data: {
      appointments: result.appointments,
    },
    meta: {
      pagination: result.pagination,
    },
  });
});

const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.getAppointmentById({
    appointmentId: req.params.id,
    actorUserId: req.user._id,
    actorRole: req.user.role,
  });

  return sendSuccess(res, {
    message: "Appointment retrieved successfully",
    data: {
      appointment,
    },
  });
});

const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.updateAppointment({
    appointmentId: req.params.id,
    updates: req.body,
    updatedBy: req.user._id,
    actorRole: req.user.role,
    ...getRequestInformation(req),
  });

  return sendSuccess(res, {
    message: "Appointment updated successfully",
    data: {
      appointment,
    },
  });
});

const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.cancelAppointment({
    appointmentId: req.params.id,
    cancellationReason: req.body.cancellationReason,
    cancelledBy: req.user._id,
    actorRole: req.user.role,
    ...getRequestInformation(req),
  });

  return sendSuccess(res, {
    message: "Appointment cancelled successfully",
    data: {
      appointment,
    },
  });
});

const markPatientArrived = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.markPatientArrived({
    appointmentId: req.params.id,
    arrivedBy: req.user._id,
    actorRole: req.user.role,
    ...getRequestInformation(req),
  });

  return sendSuccess(res, {
    message: "Patient marked as arrived successfully",
    data: {
      appointment,
    },
  });
});

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  markPatientArrived,
};
