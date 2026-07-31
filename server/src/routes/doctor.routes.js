const express = require("express");

const ROLES = require("../constants/roles");
const doctorController = require("../controllers/doctor.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const validateRequest = require("../middlewares/validateRequest");
const {
  createDoctorValidator,
  doctorIdValidator,
  listDoctorsValidator,
  updateDoctorValidator,
} = require("../validators/doctor.validator");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  listDoctorsValidator,
  validateRequest,
  doctorController.getDoctors,
);

router.get(
  "/:id",
  doctorIdValidator,
  validateRequest,
  doctorController.getDoctorById,
);

router.post(
  "/",
  authorize(ROLES.SUPER_ADMIN),
  createDoctorValidator,
  validateRequest,
  doctorController.createDoctor,
);

router.put(
  "/:id",
  authorize(ROLES.SUPER_ADMIN),
  updateDoctorValidator,
  validateRequest,
  doctorController.updateDoctor,
);

module.exports = router;
