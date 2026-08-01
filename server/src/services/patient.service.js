const crypto = require("crypto");
const { DateTime } = require("luxon");

const AUDIT_ACTIONS = require("../constants/auditActions");
const Patient = require("../models/Patient");
const ApiError = require("../utils/ApiError");
const { createAuditLog } = require("./audit.service");

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const generatePatientNumber = () => {
  const datePart = DateTime.now().setZone("Asia/Kolkata").toFormat("yyyyLLdd");

  const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `PAT-${datePart}-${randomPart}`;
};

const populatePatient = (query) => {
  return query
    .populate("createdBy", "name email role")
    .populate("updatedBy", "name email role");
};

const createPatientDocument = async (patientData) => {
  const maximumAttempts = 5;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      return await Patient.create({
        ...patientData,
        patientNumber: generatePatientNumber(),
      });
    } catch (error) {
      const patientNumberConflict =
        error.code === 11000 && error.keyPattern?.patientNumber;

      if (!patientNumberConflict || attempt === maximumAttempts) {
        throw error;
      }
    }
  }

  throw new ApiError(500, "Unable to generate patient number");
};

const findPossibleDuplicate = async ({
  name,
  dateOfBirth,
  mobile,
  excludePatientId,
}) => {
  const filter = {
    name: name.trim(),
    dateOfBirth,
    mobile,
    isActive: true,
  };

  if (excludePatientId) {
    filter._id = {
      $ne: excludePatientId,
    };
  }

  return Patient.findOne(filter).collation({
    locale: "en",
    strength: 2,
  });
};

const createPatient = async ({
  name,
  dateOfBirth,
  gender,
  mobile,
  email,
  address,
  emergencyContact,
  createdBy,
  actorRole,
  ipAddress,
  userAgent,
}) => {
  const possibleDuplicate = await findPossibleDuplicate({
    name,
    dateOfBirth,
    mobile,
  });

  if (possibleDuplicate) {
    throw new ApiError(
      409,
      `A matching patient already exists with patient number ${possibleDuplicate.patientNumber}`,
    );
  }

  const patient = await createPatientDocument({
    name: name.trim(),
    dateOfBirth,
    gender,
    mobile,
    email: email?.trim().toLowerCase() || "",
    address: address?.trim() || "",
    emergencyContact: {
      name: emergencyContact?.name?.trim() || "",
      relationship: emergencyContact?.relationship?.trim() || "",
      mobile: emergencyContact?.mobile || "",
    },
    createdBy,
  });

  await createAuditLog({
    user: createdBy,
    role: actorRole,
    action: AUDIT_ACTIONS.PATIENT_CREATED,
    entityType: "Patient",
    entityId: patient._id,
    metadata: {
      patientNumber: patient.patientNumber,
    },
    ipAddress,
    userAgent,
  });

  return populatePatient(Patient.findById(patient._id));
};

const getPatients = async ({
  search,
  mobile,
  patientNumber,
  page = 1,
  limit = 20,
  sortBy = "createdAt",
  sortOrder = "desc",
  includeInactive = false,
}) => {
  const filter = {};

  if (!includeInactive) {
    filter.isActive = true;
  }

  if (patientNumber) {
    filter.patientNumber = patientNumber.trim().toUpperCase();
  }

  if (mobile) {
    filter.mobile = {
      $regex: escapeRegex(mobile),
    };
  }

  if (search) {
    const escapedSearch = escapeRegex(search.trim());

    filter.$or = [
      {
        patientNumber: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        name: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        mobile: {
          $regex: escapedSearch,
        },
      },
      {
        email: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const [patients, totalItems] = await Promise.all([
    Patient.find(filter)
      .select(
        "patientNumber name dateOfBirth gender mobile email address emergencyContact isActive createdAt updatedAt",
      )
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

    Patient.countDocuments(filter),
  ]);

  return {
    patients,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit),
    },
  };
};

const getPatientById = async ({ patientId, includeInactive = false }) => {
  const filter = {
    _id: patientId,
  };

  if (!includeInactive) {
    filter.isActive = true;
  }

  const patient = await populatePatient(Patient.findOne(filter));

  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  return patient;
};

const updatePatient = async ({
  patientId,
  updates,
  updatedBy,
  actorRole,
  ipAddress,
  userAgent,
}) => {
  const patient = await Patient.findById(patientId);

  if (!patient) {
    throw new ApiError(404, "Patient not found");
  }

  const nextName =
    updates.name !== undefined ? updates.name.trim() : patient.name;

  const nextDateOfBirth =
    updates.dateOfBirth !== undefined
      ? updates.dateOfBirth
      : patient.dateOfBirth;

  const nextMobile =
    updates.mobile !== undefined ? updates.mobile : patient.mobile;

  const possibleDuplicate = await findPossibleDuplicate({
    name: nextName,
    dateOfBirth: nextDateOfBirth,
    mobile: nextMobile,
    excludePatientId: patientId,
  });

  if (possibleDuplicate) {
    throw new ApiError(
      409,
      `A matching patient already exists with patient number ${possibleDuplicate.patientNumber}`,
    );
  }

  const allowedFields = [
    "name",
    "dateOfBirth",
    "gender",
    "mobile",
    "email",
    "address",
    "emergencyContact",
    "isActive",
  ];

  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      patient[field] = updates[field];
    }
  });

  if (updates.name !== undefined) {
    patient.name = updates.name.trim();
  }

  if (updates.email !== undefined) {
    patient.email = updates.email ? updates.email.trim().toLowerCase() : "";
  }

  if (updates.address !== undefined) {
    patient.address = updates.address.trim();
  }

  if (updates.emergencyContact !== undefined) {
    patient.emergencyContact = {
      name:
        updates.emergencyContact.name?.trim() ||
        patient.emergencyContact?.name ||
        "",
      relationship:
        updates.emergencyContact.relationship?.trim() ||
        patient.emergencyContact?.relationship ||
        "",
      mobile:
        updates.emergencyContact.mobile ??
        patient.emergencyContact?.mobile ??
        "",
    };
  }

  patient.updatedBy = updatedBy;

  await patient.save();

  await createAuditLog({
    user: updatedBy,
    role: actorRole,
    action: AUDIT_ACTIONS.PATIENT_UPDATED,
    entityType: "Patient",
    entityId: patient._id,
    metadata: {
      patientNumber: patient.patientNumber,
      updatedFields: Object.keys(updates),
    },
    ipAddress,
    userAgent,
  });

  return populatePatient(Patient.findById(patient._id));
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
};
