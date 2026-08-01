const express = require("express");

const departmentController = require("../controllers/department.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const validateRequest = require("../middlewares/validateRequest");
const ROLES = require("../constants/roles");
const {
  createDepartmentValidator,
  updateDepartmentValidator,
  departmentIdValidator,
  listDepartmentsValidator,
} = require("../validators/department.validator");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  listDepartmentsValidator,
  validateRequest,
  departmentController.getDepartments,
);

router.get(
  "/:id",
  departmentIdValidator,
  validateRequest,
  departmentController.getDepartmentById,
);

router.post(
  "/",
  authorize(ROLES.SUPER_ADMIN),
  createDepartmentValidator,
  validateRequest,
  departmentController.createDepartment,
);

router.put(
  "/:id",
  authorize(ROLES.SUPER_ADMIN),
  updateDepartmentValidator,
  validateRequest,
  departmentController.updateDepartment,
);

module.exports = router;
