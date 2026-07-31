const express = require("express");

const doctorController = require("../controllers/doctor.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const ROLES = require("../constants/roles");

const router = express.Router();

router.use(authenticate);

router.get("/", doctorController.getDoctors);

router.get("/:id", doctorController.getDoctorById);

router.post("/", authorize(ROLES.SUPER_ADMIN), doctorController.createDoctor);

router.put("/:id", authorize(ROLES.SUPER_ADMIN), doctorController.updateDoctor);

module.exports = router;
