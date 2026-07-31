const ROLES = require("../constants/roles");
const scheduleService = require("../services/schedule.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");

const getRequestInformation = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get("user-agent") || null,
});

const createSchedule = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.createSchedule({
    ...req.body,
    createdBy: req.user._id,
    actorRole: req.user.role,
    ...getRequestInformation(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Doctor schedule created successfully",
    data: {
      schedule,
    },
  });
});

const getDoctorSchedules = asyncHandler(async (req, res) => {
  const includeInactive =
    req.user.role === ROLES.SUPER_ADMIN && req.query.includeInactive === "true";

  const schedules = await scheduleService.getDoctorSchedules({
    doctorId: req.params.doctorId,
    includeInactive,
  });

  return sendSuccess(res, {
    message: "Doctor schedules retrieved successfully",
    data: {
      schedules,
    },
    meta: {
      total: schedules.length,
    },
  });
});

const getScheduleById = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.getScheduleById({
    scheduleId: req.params.id,
    includeInactive: req.user.role === ROLES.SUPER_ADMIN,
  });

  return sendSuccess(res, {
    message: "Doctor schedule retrieved successfully",
    data: {
      schedule,
    },
  });
});

const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await scheduleService.updateSchedule({
    scheduleId: req.params.id,
    updates: req.body,
    updatedBy: req.user._id,
    actorRole: req.user.role,
    ...getRequestInformation(req),
  });

  return sendSuccess(res, {
    message: "Doctor schedule updated successfully",
    data: {
      schedule,
    },
  });
});

const deactivateSchedule = asyncHandler(async (req, res) => {
  await scheduleService.deactivateSchedule({
    scheduleId: req.params.id,
    updatedBy: req.user._id,
    actorRole: req.user.role,
    ...getRequestInformation(req),
  });

  return sendSuccess(res, {
    message: "Doctor schedule deactivated successfully",
    data: {},
  });
});

module.exports = {
  createSchedule,
  getDoctorSchedules,
  getScheduleById,
  updateSchedule,
  deactivateSchedule,
};
