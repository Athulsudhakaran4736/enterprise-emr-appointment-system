const express = require("express");

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const departmentRoutes = require("./department.routes");
const doctorRoutes = require("./doctor.routes");
const scheduleRoutes = require("./schedule.routes");
const patientRoutes = require("./patient.routes");
const slotRoutes = require("./slot.routes");
const appointmentRoutes = require("./appointment.routes");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EMR Appointment Management API",
    data: {},
    meta: {},
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/departments", departmentRoutes);
router.use("/doctors", doctorRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/patients", patientRoutes);
router.use("/slots", slotRoutes);
router.use("/appointments", appointmentRoutes);

module.exports = router;
