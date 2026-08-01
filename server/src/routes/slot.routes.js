const express = require("express");

const slotController = require("../controllers/slot.controller");
const authenticate = require("../middlewares/authenticate");
const validateRequest = require("../middlewares/validateRequest");
const { getSlotsValidator } = require("../validators/slot.validator");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  getSlotsValidator,
  validateRequest,
  slotController.getDoctorSlots,
);

module.exports = router;
