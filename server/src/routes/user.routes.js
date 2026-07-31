const express = require("express");

const ROLES = require("../constants/roles");
const userController = require("../controllers/user.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const validateRequest = require("../middlewares/validateRequest");
const {
  createReceptionistValidator,
  listUsersValidator,
} = require("../validators/user.validator");

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN));

router.post(
  "/receptionists",
  createReceptionistValidator,
  validateRequest,
  userController.createReceptionist,
);

router.get("/", listUsersValidator, validateRequest, userController.getUsers);

module.exports = router;
