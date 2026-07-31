const { body, param, query } = require("express-validator");

const createDepartmentValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Department name is required")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Department name cannot exceed 100 characters"),

  body("code")
    .trim()
    .notEmpty()
    .withMessage("Department code is required")
    .bail()
    .isLength({ min: 2, max: 20 })
    .withMessage("Department code must contain between 2 and 20 characters")
    .bail()
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage(
      "Department code can contain only letters, numbers, hyphens and underscores",
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
];

const updateDepartmentValidator = [
  param("id").isMongoId().withMessage("Invalid department identifier"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Department name cannot be empty")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Department name cannot exceed 100 characters"),

  body("code")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Department code cannot be empty")
    .bail()
    .isLength({ min: 2, max: 20 })
    .withMessage("Department code must contain between 2 and 20 characters")
    .bail()
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage(
      "Department code can contain only letters, numbers, hyphens and underscores",
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),
];

const departmentIdValidator = [
  param("id").isMongoId().withMessage("Invalid department identifier"),
];

const listDepartmentsValidator = [
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search value cannot exceed 100 characters"),

  query("includeInactive")
    .optional()
    .isBoolean()
    .withMessage("includeInactive must be true or false"),
];

module.exports = {
  createDepartmentValidator,
  updateDepartmentValidator,
  departmentIdValidator,
  listDepartmentsValidator,
};
