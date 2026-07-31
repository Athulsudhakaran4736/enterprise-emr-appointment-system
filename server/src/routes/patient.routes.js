const express = require("express");

const patientController = require("../controllers/patient.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const ROLES = require("../constants/roles");

const router = express.Router();

router.use(authenticate);

router.get(
  "/search",
  authorize(ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST, ROLES.DOCTOR),
  patientController.searchPatients,
);

router.get(
  "/:id",
  authorize(ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST, ROLES.DOCTOR),
  patientController.getPatientById,
);

router.post(
  "/",
  authorize(ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST),
  patientController.createPatient,
);

module.exports = router;
