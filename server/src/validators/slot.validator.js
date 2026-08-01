const { query } = require("express-validator");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getSlotsValidator = [
  query("doctorId")
    .notEmpty()
    .withMessage("doctorId is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid doctor identifier"),

  query("date")
    .notEmpty()
    .withMessage("Date is required")
    .bail()
    .matches(DATE_PATTERN)
    .withMessage("Date must use YYYY-MM-DD format"),
];

module.exports = {
  getSlotsValidator,
};
