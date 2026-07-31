const ROLES = require("../constants/roles");
const patientService = require("../services/patient.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");

const getRequestInformation = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get("user-agent") || null,
});

const createPatient = asyncHandler(async (req, res) => {
  const patient = await patientService.createPatient({
    ...req.body,
    createdBy: req.user._id,
    actorRole: req.user.role,
    ...getRequestInformation(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Patient created successfully",
    data: {
      patient,
    },
  });
});

const getPatients = asyncHandler(async (req, res) => {
  const result = await patientService.getPatients({
    search: req.query.search,
    mobile: req.query.mobile,
    patientNumber: req.query.patientNumber,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    sortBy: req.query.sortBy || "createdAt",
    sortOrder: req.query.sortOrder || "desc",
    includeInactive:
      req.user.role === ROLES.SUPER_ADMIN &&
      req.query.includeInactive === "true",
  });

  return sendSuccess(res, {
    message: "Patients retrieved successfully",
    data: {
      patients: result.patients,
    },
    meta: {
      pagination: result.pagination,
    },
  });
});

const getPatientById = asyncHandler(async (req, res) => {
  const patient = await patientService.getPatientById({
    patientId: req.params.id,
    includeInactive: req.user.role === ROLES.SUPER_ADMIN,
  });

  return sendSuccess(res, {
    message: "Patient retrieved successfully",
    data: {
      patient,
    },
  });
});

const updatePatient = asyncHandler(async (req, res) => {
  const patient = await patientService.updatePatient({
    patientId: req.params.id,
    updates: req.body,
    updatedBy: req.user._id,
    actorRole: req.user.role,
    ...getRequestInformation(req),
  });

  return sendSuccess(res, {
    message: "Patient updated successfully",
    data: {
      patient,
    },
  });
});

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
};
