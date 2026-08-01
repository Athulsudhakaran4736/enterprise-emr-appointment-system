const ROLES = require("../constants/roles");
const doctorService = require("../services/doctor.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");

const getRequestInformation = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get("user-agent") || null,
});

const createDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorService.createDoctor({
    ...req.body,
    createdBy: req.user._id,
    ...getRequestInformation(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Doctor created successfully",
    data: {
      doctor,
    },
  });
});

const getDoctors = asyncHandler(async (req, res) => {
  const result = await doctorService.getDoctors({
    department: req.query.department,
    isActive:
      req.query.isActive === undefined
        ? undefined
        : req.query.isActive === "true",
    search: req.query.search,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    includeInactive: req.user.role === ROLES.SUPER_ADMIN,
  });

  return sendSuccess(res, {
    message: "Doctors retrieved successfully",
    data: {
      doctors: result.doctors,
    },
    meta: {
      pagination: result.pagination,
    },
  });
});

const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await doctorService.getDoctorById({
    doctorId: req.params.id,
    includeInactive: req.user.role === ROLES.SUPER_ADMIN,
  });

  return sendSuccess(res, {
    message: "Doctor retrieved successfully",
    data: {
      doctor,
    },
  });
});

const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await doctorService.updateDoctor({
    doctorId: req.params.id,
    updates: req.body,
    updatedBy: req.user._id,
    ...getRequestInformation(req),
  });

  return sendSuccess(res, {
    message: "Doctor updated successfully",
    data: {
      doctor,
    },
  });
});

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
};
