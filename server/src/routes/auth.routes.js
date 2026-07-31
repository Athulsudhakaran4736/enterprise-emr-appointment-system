const express = require("express");

const authController = require("../controllers/auth.controller");
const authenticate = require("../middlewares/authenticate");
const validateRequest = require("../middlewares/validateRequest");
const { loginValidator } = require("../validators/auth.validator");

const router = express.Router();

router.post("/login", loginValidator, validateRequest, authController.login);

router.post("/refresh", authController.refresh);

router.post("/logout", authController.logout);

router.get("/me", authenticate, authController.getCurrentUser);

module.exports = router;
