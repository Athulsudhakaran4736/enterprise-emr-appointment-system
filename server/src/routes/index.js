const express = require("express");

const authRoutes = require("./auth.routes");
const departmentRoutes = require("./department.routes");

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
router.use("/departments", departmentRoutes);

module.exports = router;
