const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const AUDIT_ACTIONS = require("../constants/auditActions");
const ROLES = require("../constants/roles");
const Department = require("../models/Department");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { createAuditLog } = require("./audit.service");

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const populateDoctor = (query) => {
  return query
    .populate("user", "name email role isActive")
    .populate("department", "name code isActive")
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");
};

const createDoctor = async ({
  name,
  email,
  password,
  department,
  specialization,
  registrationNumber,
  qualification,
  consultationDuration,
  createdBy,
  ipAddress,
  userAgent,
}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRegistrationNumber = registrationNumber.trim().toUpperCase();

  const activeDepartment = await Department.findOne({
    _id: department,
    isActive: true,
  });

  if (!activeDepartment) {
    throw new ApiError(404, "Active department not found");
  }

  const [existingUser, existingDoctor] = await Promise.all([
    User.findOne({ email: normalizedEmail }),
    Doctor.findOne({
      registrationNumber: normalizedRegistrationNumber,
    }),
  ]);

  if (existingUser) {
    throw new ApiError(409, "A user with this email address already exists");
  }

  if (existingDoctor) {
    throw new ApiError(
      409,
      "A doctor with this registration number already exists",
    );
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const session = await mongoose.startSession();
  let doctorId;

  try {
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [
          {
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            role: ROLES.DOCTOR,
          },
        ],
        { session },
      );

      const [doctor] = await Doctor.create(
        [
          {
            user: user._id,
            department,
            specialization: specialization.trim(),
            registrationNumber: normalizedRegistrationNumber,
            qualification: qualification?.trim() || "",
            consultationDuration: consultationDuration || 15,
            createdBy,
          },
        ],
        { session },
      );

      doctorId = doctor._id;
    });
  } finally {
    await session.endSession();
  }

  await createAuditLog({
    user: createdBy,
    role: ROLES.SUPER_ADMIN,
    action: AUDIT_ACTIONS.DOCTOR_CREATED,
    entityType: "Doctor",
    entityId: doctorId,
    metadata: {
      department,
    },
    ipAddress,
    userAgent,
  });

  return populateDoctor(Doctor.findById(doctorId));
};

const getDoctors = async ({
  department,
  isActive,
  search,
  page = 1,
  limit = 20,
  includeInactive = false,
}) => {
  const filter = {};

  if (department) {
    filter.department = department;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive;
  } else if (!includeInactive) {
    filter.isActive = true;
  }

  if (search) {
    const escapedSearch = escapeRegex(search.trim());

    const matchingUsers = await User.find({
      role: ROLES.DOCTOR,
      $or: [
        {
          name: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          email: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ],
    }).distinct("_id");

    filter.$or = [
      {
        user: {
          $in: matchingUsers,
        },
      },
      {
        specialization: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
      {
        registrationNumber: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [doctors, totalItems] = await Promise.all([
    populateDoctor(
      Doctor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ).lean(),

    Doctor.countDocuments(filter),
  ]);

  return {
    doctors,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

const getDoctorById = async ({ doctorId, includeInactive = false }) => {
  const filter = {
    _id: doctorId,
  };

  if (!includeInactive) {
    filter.isActive = true;
  }

  const doctor = await populateDoctor(Doctor.findOne(filter));

  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  return doctor;
};

const updateDoctor = async ({
  doctorId,
  updates,
  updatedBy,
  ipAddress,
  userAgent,
}) => {
  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  if (updates.department !== undefined) {
    const department = await Department.findOne({
      _id: updates.department,
      isActive: true,
    });

    if (!department) {
      throw new ApiError(404, "Active department not found");
    }
  }

  if (updates.registrationNumber !== undefined) {
    const normalizedRegistrationNumber = updates.registrationNumber
      .trim()
      .toUpperCase();

    const duplicateDoctor = await Doctor.findOne({
      _id: {
        $ne: doctorId,
      },
      registrationNumber: normalizedRegistrationNumber,
    });

    if (duplicateDoctor) {
      throw new ApiError(
        409,
        "A doctor with this registration number already exists",
      );
    }

    updates.registrationNumber = normalizedRegistrationNumber;
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const doctorUpdates = {
        updatedBy,
      };

      const allowedDoctorFields = [
        "department",
        "specialization",
        "registrationNumber",
        "qualification",
        "consultationDuration",
        "isActive",
      ];

      allowedDoctorFields.forEach((field) => {
        if (updates[field] !== undefined) {
          doctorUpdates[field] = updates[field];
        }
      });

      await Doctor.updateOne(
        { _id: doctorId },
        {
          $set: doctorUpdates,
        },
        { session },
      );

      const userUpdates = {};

      if (updates.name !== undefined) {
        userUpdates.name = updates.name.trim();
      }

      if (updates.isActive !== undefined) {
        userUpdates.isActive = updates.isActive;
      }

      if (Object.keys(userUpdates).length > 0) {
        await User.updateOne(
          { _id: doctor.user },
          {
            $set: userUpdates,
          },
          { session },
        );
      }
    });
  } finally {
    await session.endSession();
  }

  await createAuditLog({
    user: updatedBy,
    role: ROLES.SUPER_ADMIN,
    action: AUDIT_ACTIONS.DOCTOR_UPDATED,
    entityType: "Doctor",
    entityId: doctorId,
    metadata: {
      updatedFields: Object.keys(updates),
    },
    ipAddress,
    userAgent,
  });

  return populateDoctor(Doctor.findById(doctorId));
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
};
