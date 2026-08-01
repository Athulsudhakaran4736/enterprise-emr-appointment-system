const express = require("express");

const ROLES = require("../constants/roles");
const scheduleController = require("../controllers/schedule.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const validateRequest = require("../middlewares/validateRequest");
const {
  createScheduleValidator,
  updateScheduleValidator,
  scheduleIdValidator,
  doctorScheduleValidator,
} = require("../validators/schedule.validator");

const router = express.Router();

router.use(authenticate);

router.get(
  "/doctor/:doctorId",
  doctorScheduleValidator,
  validateRequest,
  scheduleController.getDoctorSchedules,
);

router.get(
  "/:id",
  scheduleIdValidator,
  validateRequest,
  scheduleController.getScheduleById,
);

router.post(
  "/",
  authorize(ROLES.SUPER_ADMIN),
  createScheduleValidator,
  validateRequest,
  scheduleController.createSchedule,
);

router.put(
  "/:id",
  authorize(ROLES.SUPER_ADMIN),
  updateScheduleValidator,
  validateRequest,
  scheduleController.updateSchedule,
);

router.delete(
  "/:id",
  authorize(ROLES.SUPER_ADMIN),
  scheduleIdValidator,
  validateRequest,
  scheduleController.deactivateSchedule,
);

module.exports = router;
