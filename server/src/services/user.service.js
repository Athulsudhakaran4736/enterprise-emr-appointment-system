const bcrypt = require("bcryptjs");

const AUDIT_ACTIONS = require("../constants/auditActions");
const ROLES = require("../constants/roles");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { createAuditLog } = require("./audit.service");

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const createReceptionist = async ({
  name,
  email,
  password,
  createdBy,
  ipAddress,
  userAgent,
}) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    throw new ApiError(409, "A user with this email address already exists");
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: ROLES.RECEPTIONIST,
  });

  await createAuditLog({
    user: createdBy,
    role: ROLES.SUPER_ADMIN,
    action: AUDIT_ACTIONS.RECEPTIONIST_CREATED,
    entityType: "User",
    entityId: user._id,
    metadata: {
      createdUserRole: ROLES.RECEPTIONIST,
    },
    ipAddress,
    userAgent,
  });

  return sanitizeUser(user);
};

const getUsers = async ({ role, isActive, search, page = 1, limit = 20 }) => {
  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  if (search) {
    const escapedSearch = escapeRegex(search.trim());

    filter.$or = [
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
    ];
  }

  const skip = (page - 1) * limit;

  const [users, totalItems] = await Promise.all([
    User.find(filter)
      .select("name email role isActive lastLoginAt createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

module.exports = {
  createReceptionist,
  getUsers,
};
