const { body, param, query } = require("express-validator");

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const workingDaysValidators = [
  body("workingDays")
    .isArray({ min: 1 })
    .withMessage("At least one working day is required"),

  body("workingDays.*.dayOfWeek")
    .isInt({ min: 0, max: 6 })
    .withMessage("dayOfWeek must be between 0 and 6"),

  body("workingDays.*.isWorking")
    .isBoolean()
    .withMessage("isWorking must be a boolean"),

  body("workingDays.*.sessions")
    .isArray()
    .withMessage("Sessions must be an array"),

  body("workingDays.*.sessions.*.startTime")
    .matches(TIME_PATTERN)
    .withMessage("Session start time must use HH:mm format"),

  body("workingDays.*.sessions.*.endTime")
    .matches(TIME_PATTERN)
    .withMessage("Session end time must use HH:mm format"),

  body("workingDays.*.sessions.*.breaks")
    .optional()
    .isArray()
    .withMessage("Breaks must be an array"),

  body("workingDays.*.sessions.*.breaks.*.startTime")
    .optional()
    .matches(TIME_PATTERN)
    .withMessage("Break start time must use HH:mm format"),

  body("workingDays.*.sessions.*.breaks.*.endTime")
    .optional()
    .matches(TIME_PATTERN)
    .withMessage("Break end time must use HH:mm format"),
];

const optionalWorkingDaysValidators = [
  body("workingDays")
    .optional()
    .isArray({ min: 1 })
    .withMessage("At least one working day is required"),

  body("workingDays.*.dayOfWeek")
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage("dayOfWeek must be between 0 and 6"),

  body("workingDays.*.isWorking")
    .optional()
    .isBoolean()
    .withMessage("isWorking must be a boolean"),

  body("workingDays.*.sessions")
    .optional()
    .isArray()
    .withMessage("Sessions must be an array"),

  body("workingDays.*.sessions.*.startTime")
    .optional()
    .matches(TIME_PATTERN)
    .withMessage("Session start time must use HH:mm format"),

  body("workingDays.*.sessions.*.endTime")
    .optional()
    .matches(TIME_PATTERN)
    .withMessage("Session end time must use HH:mm format"),

  body("workingDays.*.sessions.*.breaks")
    .optional()
    .isArray()
    .withMessage("Breaks must be an array"),

  body("workingDays.*.sessions.*.breaks.*.startTime")
    .optional()
    .matches(TIME_PATTERN)
    .withMessage("Break start time must use HH:mm format"),

  body("workingDays.*.sessions.*.breaks.*.endTime")
    .optional()
    .matches(TIME_PATTERN)
    .withMessage("Break end time must use HH:mm format"),
];

const createScheduleValidator = [
  body("doctor")
    .notEmpty()
    .withMessage("Doctor is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid doctor identifier"),

  ...workingDaysValidators,

  body("slotDurationMinutes")
    .isInt({ min: 5, max: 180 })
    .withMessage("Slot duration must be between 5 and 180 minutes"),

  body("timezone").trim().notEmpty().withMessage("Timezone is required"),

  body("effectiveFrom")
    .matches(DATE_PATTERN)
    .withMessage("effectiveFrom must use YYYY-MM-DD format"),

  body("effectiveTo")
    .optional({ nullable: true })
    .matches(DATE_PATTERN)
    .withMessage("effectiveTo must use YYYY-MM-DD format"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

const updateScheduleValidator = [
  param("id").isMongoId().withMessage("Invalid schedule identifier"),

  ...optionalWorkingDaysValidators,

  body("slotDurationMinutes")
    .optional()
    .isInt({ min: 5, max: 180 })
    .withMessage("Slot duration must be between 5 and 180 minutes"),

  body("timezone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Timezone cannot be empty"),

  body("effectiveFrom")
    .optional()
    .matches(DATE_PATTERN)
    .withMessage("effectiveFrom must use YYYY-MM-DD format"),

  body("effectiveTo")
    .optional({ nullable: true })
    .matches(DATE_PATTERN)
    .withMessage("effectiveTo must use YYYY-MM-DD format"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

const scheduleIdValidator = [
  param("id").isMongoId().withMessage("Invalid schedule identifier"),
];

const doctorScheduleValidator = [
  param("doctorId").isMongoId().withMessage("Invalid doctor identifier"),

  query("includeInactive")
    .optional()
    .isBoolean()
    .withMessage("includeInactive must be true or false"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
];

module.exports = {
  createScheduleValidator,
  updateScheduleValidator,
  scheduleIdValidator,
  doctorScheduleValidator,
};
