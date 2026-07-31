const express = require("express");

const departmentController = require("../controllers/department.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const ROLES = require("../constants/roles");

const router = express.Router();

router.use(authenticate);

router.get("/", departmentController.getDepartments);

router.get("/:id", departmentController.getDepartmentById);

router.post(
  "/",
  authorize(ROLES.SUPER_ADMIN),
  departmentController.createDepartment,
);

router.put(
  "/:id",
  authorize(ROLES.SUPER_ADMIN),
  departmentController.updateDepartment,
);

module.exports = router;
