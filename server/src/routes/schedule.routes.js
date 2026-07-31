const express = require("express");

const scheduleController = require("../controllers/schedule.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const ROLES = require("../constants/roles");

const router = express.Router();

router.use(authenticate);

router.get("/doctor/:doctorId", scheduleController.getDoctorSchedules);

router.get("/:id", scheduleController.getScheduleById);

router.post(
  "/",
  authorize(ROLES.SUPER_ADMIN),
  scheduleController.createSchedule,
);

router.put(
  "/:id",
  authorize(ROLES.SUPER_ADMIN),
  scheduleController.updateSchedule,
);

router.delete(
  "/:id",
  authorize(ROLES.SUPER_ADMIN),
  scheduleController.deleteSchedule,
);

module.exports = router;
