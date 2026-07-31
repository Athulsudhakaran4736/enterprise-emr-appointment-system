const express = require("express");

const appointmentController = require("../controllers/appointment.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const ROLES = require("../constants/roles");

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST),
  appointmentController.createAppointment,
);

router.get(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST, ROLES.DOCTOR),
  appointmentController.getAppointments,
);

router.get(
  "/:id",
  authorize(ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST, ROLES.DOCTOR),
  appointmentController.getAppointmentById,
);

router.put(
  "/:id",
  authorize(ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST, ROLES.DOCTOR),
  appointmentController.updateAppointment,
);

router.delete(
  "/:id",
  authorize(ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST),
  appointmentController.cancelAppointment,
);

router.post(
  "/:id/arrive",
  authorize(ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST),
  appointmentController.markPatientArrived,
);

router.post(
  "/:id/complete",
  authorize(ROLES.SUPER_ADMIN, ROLES.DOCTOR),
  appointmentController.completeAppointment,
);

module.exports = router;
