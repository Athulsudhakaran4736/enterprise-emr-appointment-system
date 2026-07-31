const { body, param, query } = require("express-validator");
const { DateTime } = require("luxon");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const GENDERS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];

const normalizeMobile = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/\D/g, "");
};

const validateDateOfBirth = (value) => {
  const date = DateTime.fromISO(value, {
    zone: "Asia/Kolkata",
  });

  if (!date.isValid || date.toISODate() !== value) {
    throw new Error("Date of birth must be a valid date");
  }

  if (
    date.startOf("day") > DateTime.now().setZone("Asia/Kolkata").startOf("day")
  ) {
    throw new Error("Date of birth cannot be in the future");
  }

  return true;
};

const patientFieldsValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Patient name is required")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Patient name cannot exceed 100 characters"),

  body("dateOfBirth")
    .notEmpty()
    .withMessage("Date of birth is required")
    .bail()
    .matches(DATE_PATTERN)
    .withMessage("Date of birth must use YYYY-MM-DD format")
    .bail()
    .custom(validateDateOfBirth),

  body("gender")
    .notEmpty()
    .withMessage("Gender is required")
    .bail()
    .isIn(GENDERS)
    .withMessage("Invalid gender"),

  body("mobile")
    .notEmpty()
    .withMessage("Mobile number is required")
    .bail()
    .customSanitizer(normalizeMobile)
    .isLength({ min: 10, max: 15 })
    .withMessage("Mobile number must contain between 10 and 15 digits"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),

  body("emergencyContact")
    .optional()
    .isObject()
    .withMessage("Emergency contact must be an object"),

  body("emergencyContact.name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Emergency contact name cannot exceed 100 characters"),

  body("emergencyContact.relationship")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Relationship cannot exceed 50 characters"),

  body("emergencyContact.mobile")
    .optional({ checkFalsy: true })
    .customSanitizer(normalizeMobile)
    .isLength({ min: 10, max: 15 })
    .withMessage(
      "Emergency contact mobile must contain between 10 and 15 digits",
    ),
];

const createPatientValidator = patientFieldsValidator;

const updatePatientValidator = [
  param("id").isMongoId().withMessage("Invalid patient identifier"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Patient name cannot be empty")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Patient name cannot exceed 100 characters"),

  body("dateOfBirth")
    .optional()
    .matches(DATE_PATTERN)
    .withMessage("Date of birth must use YYYY-MM-DD format")
    .bail()
    .custom(validateDateOfBirth),

  body("gender").optional().isIn(GENDERS).withMessage("Invalid gender"),

  body("mobile")
    .optional()
    .customSanitizer(normalizeMobile)
    .isLength({ min: 10, max: 15 })
    .withMessage("Mobile number must contain between 10 and 15 digits"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),

  body("emergencyContact")
    .optional()
    .isObject()
    .withMessage("Emergency contact must be an object"),

  body("emergencyContact.name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Emergency contact name cannot exceed 100 characters"),

  body("emergencyContact.relationship")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Relationship cannot exceed 50 characters"),

  body("emergencyContact.mobile")
    .optional({ checkFalsy: true })
    .customSanitizer(normalizeMobile)
    .isLength({ min: 10, max: 15 })
    .withMessage(
      "Emergency contact mobile must contain between 10 and 15 digits",
    ),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

const patientIdValidator = [
  param("id").isMongoId().withMessage("Invalid patient identifier"),
];

const listPatientsValidator = [
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search cannot exceed 100 characters"),

  query("mobile")
    .optional()
    .customSanitizer(normalizeMobile)
    .isLength({ min: 3, max: 15 })
    .withMessage("Mobile search must contain between 3 and 15 digits"),

  query("patientNumber")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Patient number cannot exceed 50 characters"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("sortBy")
    .optional()
    .isIn(["name", "createdAt", "updatedAt"])
    .withMessage("Invalid sort field"),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort order must be asc or desc"),

  query("includeInactive")
    .optional()
    .isBoolean()
    .withMessage("includeInactive must be true or false"),
];

module.exports = {
  createPatientValidator,
  updatePatientValidator,
  patientIdValidator,
  listPatientsValidator,
};
