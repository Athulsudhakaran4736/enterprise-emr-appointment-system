const userService = require("../services/user.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");

const getRequestInformation = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get("user-agent") || null,
});

const createReceptionist = asyncHandler(async (req, res) => {
  const user = await userService.createReceptionist({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    createdBy: req.user._id,
    ...getRequestInformation(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Receptionist created successfully",
    data: {
      user,
    },
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const result = await userService.getUsers({
    role: req.query.role,
    isActive:
      req.query.isActive === undefined
        ? undefined
        : req.query.isActive === "true",
    search: req.query.search,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
  });

  return sendSuccess(res, {
    message: "Users retrieved successfully",
    data: {
      users: result.users,
    },
    meta: {
      pagination: result.pagination,
    },
  });
});

module.exports = {
  createReceptionist,
  getUsers,
};
