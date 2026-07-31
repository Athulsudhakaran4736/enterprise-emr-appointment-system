const express = require("express");

const ROLES = require("../constants/roles");
const patientController = require("../controllers/patient.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const validateRequest = require("../middlewares/validateRequest");
const {
  createPatientValidator,
  updatePatientValidator,
  patientIdValidator,
  listPatientsValidator,
} = require("../validators/patient.validator");

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN, ROLES.RECEPTIONIST));

router.get(
  "/",
  listPatientsValidator,
  validateRequest,
  patientController.getPatients,
);

router.get(
  "/:id",
  patientIdValidator,
  validateRequest,
  patientController.getPatientById,
);

router.post(
  "/",
  createPatientValidator,
  validateRequest,
  patientController.createPatient,
);

router.put(
  "/:id",
  updatePatientValidator,
  validateRequest,
  patientController.updatePatient,
);

module.exports = router;
