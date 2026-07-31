const Department = require("../models/Department");
const ROLES = require("../constants/roles");
const ApiError = require("../utils/ApiError");

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const createDepartment = async ({ name, code, description, userId }) => {
  const normalizedName = name.trim();
  const normalizedCode = code.trim().toUpperCase();

  const existingDepartment = await Department.findOne({
    $or: [
      {
        name: normalizedName,
      },
      {
        code: normalizedCode,
      },
    ],
  }).collation({
    locale: "en",
    strength: 2,
  });

  if (existingDepartment) {
    if (
      existingDepartment.name.toLowerCase() === normalizedName.toLowerCase()
    ) {
      throw new ApiError(409, "A department with this name already exists");
    }

    throw new ApiError(409, "A department with this code already exists");
  }

  const department = await Department.create({
    name: normalizedName,
    code: normalizedCode,
    description: description?.trim() || "",
    createdBy: userId,
  });

  return department;
};

const getDepartments = async ({
  search,
  includeInactive,
  currentUserRole,
  page = 1,
  limit = 20,
}) => {
  const filter = {};

  const canViewInactive =
    currentUserRole === ROLES.SUPER_ADMIN && includeInactive === true;

  if (!canViewInactive) {
    filter.isActive = true;
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
        code: {
          $regex: escapedSearch,
          $options: "i",
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [departments, totalItems] = await Promise.all([
    Department.find(filter)
      .select(
        "name code description isActive createdBy updatedBy createdAt updatedAt",
      )
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({
        name: 1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),
    Department.countDocuments(filter),
  ]);

  return {
    departments,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / limit),
    },
  };
};

const getDepartmentById = async ({ departmentId, currentUserRole }) => {
  const filter = {
    _id: departmentId,
  };

  if (currentUserRole !== ROLES.SUPER_ADMIN) {
    filter.isActive = true;
  }

  const department = await Department.findOne(filter)
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email");

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  return department;
};

const updateDepartment = async ({ departmentId, updates, userId }) => {
  const department = await Department.findById(departmentId);

  if (!department) {
    throw new ApiError(404, "Department not found");
  }

  if (updates.name !== undefined) {
    const normalizedName = updates.name.trim();

    const duplicateName = await Department.findOne({
      _id: {
        $ne: departmentId,
      },
      name: normalizedName,
    }).collation({
      locale: "en",
      strength: 2,
    });

    if (duplicateName) {
      throw new ApiError(409, "A department with this name already exists");
    }

    department.name = normalizedName;
  }

  if (updates.code !== undefined) {
    const normalizedCode = updates.code.trim().toUpperCase();

    const duplicateCode = await Department.findOne({
      _id: {
        $ne: departmentId,
      },
      code: normalizedCode,
    });

    if (duplicateCode) {
      throw new ApiError(409, "A department with this code already exists");
    }

    department.code = normalizedCode;
  }

  if (updates.description !== undefined) {
    department.description = updates.description.trim();
  }

  if (updates.isActive !== undefined) {
    department.isActive = updates.isActive;
  }

  department.updatedBy = userId;

  await department.save();

  return department;
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
};
