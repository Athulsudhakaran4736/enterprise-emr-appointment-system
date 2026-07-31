const express = require("express");

const ROLES = require("../constants/roles");
const appointmentController = require("../controllers/appointment.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const validateRequest = require("../middlewares/validateRequest");

const {
  createAppointmentValidator,
  listAppointmentsValidator,
  appointmentIdValidator,
  updateAppointmentValidator,
  cancelAppointmentValidator,
  completeAppointmentValidator,
} = require("../validators/appointment.validator");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  listAppointmentsValidator,
  validateRequest,
  appointmentController.getAppointments,
);

router.get(
  "/:id",
  appointmentIdValidator,
  validateRequest,
  appointmentController.getAppointmentById,
);

router.post(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST),
  createAppointmentValidator,
  validateRequest,
  appointmentController.createAppointment,
);

router.put(
  "/:id",
  authorize(ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST),
  updateAppointmentValidator,
  validateRequest,
  appointmentController.updateAppointment,
);

router.delete(
  "/:id",
  authorize(ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST),
  cancelAppointmentValidator,
  validateRequest,
  appointmentController.cancelAppointment,
);

router.post(
  "/:id/arrive",
  authorize(ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST),
  appointmentIdValidator,
  validateRequest,
  appointmentController.markPatientArrived,
);

router.post(
  "/:id/complete",
  authorize(ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST),
  completeAppointmentValidator,
  validateRequest,
  appointmentController.markAppointmentCompleted,
);

module.exports = router;
