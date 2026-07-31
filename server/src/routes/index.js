const express = require("express");

const authRoutes = require("./auth.routes");
const departmentRoutes = require("./department.routes");
const userRoutes = require("./user.routes");
const doctorRoutes = require("./doctor.routes");

const router = express.Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "EMR Appointment Management API",
    data: {},
    meta: {},
  });
});

router.use("/auth", authRoutes);
router.use("/departments", departmentRoutes);
router.use("/users", userRoutes);
router.use("/doctors", doctorRoutes);

module.exports = router;
