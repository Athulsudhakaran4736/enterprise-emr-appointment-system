const express = require("express");

const authRoutes = require("./auth.routes");
const departmentRoutes = require("./department.routes");
const userRoutes = require("./user.routes");
const doctorRoutes = require("./doctor.routes");
const scheduleRoutes = require("./schedule.routes");
const slotRoutes = require("./slot.routes");
const patientRoutes = require("./patient.routes");
const appointmentRoutes = require("./appointment.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/departments", departmentRoutes);
router.use("/users", userRoutes);
router.use("/doctors", doctorRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/slots", slotRoutes);
router.use("/patients", patientRoutes);
router.use("/appointments", appointmentRoutes);

module.exports = router;
