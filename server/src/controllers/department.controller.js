const departmentService = require("../services/department.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");

const createDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.createDepartment({
    name: req.body.name,
    code: req.body.code,
    description: req.body.description,
    userId: req.user._id,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Department created successfully",
    data: {
      department,
    },
  });
});

const getDepartments = asyncHandler(async (req, res) => {
  const result = await departmentService.getDepartments({
    search: req.query.search,
    includeInactive: req.query.includeInactive === "true",
    currentUserRole: req.user.role,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
  });

  return sendSuccess(res, {
    message: "Departments retrieved successfully",
    data: {
      departments: result.departments,
    },
    meta: {
      pagination: result.pagination,
    },
  });
});

const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await departmentService.getDepartmentById({
    departmentId: req.params.id,
    currentUserRole: req.user.role,
  });

  return sendSuccess(res, {
    message: "Department retrieved successfully",
    data: {
      department,
    },
  });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.updateDepartment({
    departmentId: req.params.id,
    updates: req.body,
    userId: req.user._id,
  });

  return sendSuccess(res, {
    message: "Department updated successfully",
    data: {
      department,
    },
  });
});

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
};
