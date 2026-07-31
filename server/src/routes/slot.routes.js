const express = require("express");

const slotController = require("../controllers/slot.controller");
const authenticate = require("../middlewares/authenticate");

const router = express.Router();

router.get("/", authenticate, slotController.getSlots);

module.exports = router;
