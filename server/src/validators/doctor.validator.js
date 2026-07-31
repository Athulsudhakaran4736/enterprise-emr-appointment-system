const { body, param, query } = require("express-validator");

const createDoctorValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Doctor name is required")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must contain between 8 and 128 characters"),

  body("department")
    .notEmpty()
    .withMessage("Department is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid department identifier"),

  body("specialization")
    .trim()
    .notEmpty()
    .withMessage("Specialization is required")
    .bail()
    .isLength({ max: 150 })
    .withMessage("Specialization cannot exceed 150 characters"),

  body("registrationNumber")
    .trim()
    .notEmpty()
    .withMessage("Registration number is required")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Registration number cannot exceed 100 characters"),

  body("qualification")
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage("Qualification cannot exceed 250 characters"),

  body("consultationDuration")
    .optional()
    .isInt({ min: 5, max: 180 })
    .withMessage("Consultation duration must be between 5 and 180 minutes"),
];

const doctorIdValidator = [
  param("id").isMongoId().withMessage("Invalid doctor identifier"),
];

const listDoctorsValidator = [
  query("department")
    .optional()
    .isMongoId()
    .withMessage("Invalid department identifier"),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false"),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search cannot exceed 100 characters"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

const updateDoctorValidator = [
  ...doctorIdValidator,

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Doctor name cannot be empty")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("department")
    .optional()
    .isMongoId()
    .withMessage("Invalid department identifier"),

  body("specialization")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Specialization cannot be empty")
    .bail()
    .isLength({ max: 150 })
    .withMessage("Specialization cannot exceed 150 characters"),

  body("registrationNumber")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Registration number cannot be empty")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Registration number cannot exceed 100 characters"),

  body("qualification")
    .optional()
    .trim()
    .isLength({ max: 250 })
    .withMessage("Qualification cannot exceed 250 characters"),

  body("consultationDuration")
    .optional()
    .isInt({ min: 5, max: 180 })
    .withMessage("Consultation duration must be between 5 and 180 minutes"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
];

module.exports = {
  createDoctorValidator,
  doctorIdValidator,
  listDoctorsValidator,
  updateDoctorValidator,
};
