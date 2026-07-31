const express = require("express");

const userController = require("../controllers/user.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const ROLES = require("../constants/roles");

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN));

router.post("/receptionists", userController.createReceptionist);

router.get("/", userController.getUsers);

module.exports = router;
