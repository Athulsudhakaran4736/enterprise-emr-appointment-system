const { body, param, query } = require("express-validator");
const { DateTime } = require("luxon");

const APPOINTMENT_STATUSES = require("../constants/appointmentStatus");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const GENDERS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];

const normalizeMobile = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/\D/g, "");
};

const validateDate = (value, fieldName) => {
  const date = DateTime.fromISO(value);

  if (!date.isValid || date.toISODate() !== value) {
    throw new Error(`${fieldName} must be a valid date in YYYY-MM-DD format`);
  }

  return true;
};

const validateNewPatient = (patient) => {
  if (!patient || typeof patient !== "object" || Array.isArray(patient)) {
    throw new Error("Patient details must be an object");
  }

  if (typeof patient.name !== "string" || patient.name.trim().length === 0) {
    throw new Error("New patient name is required");
  }

  if (
    typeof patient.dateOfBirth !== "string" ||
    !DATE_PATTERN.test(patient.dateOfBirth)
  ) {
    throw new Error("New patient date of birth must use YYYY-MM-DD format");
  }

  validateDate(patient.dateOfBirth, "New patient date of birth");

  const dateOfBirth = DateTime.fromISO(patient.dateOfBirth).startOf("day");

  if (dateOfBirth > DateTime.now().startOf("day")) {
    throw new Error("New patient date of birth cannot be in the future");
  }

  if (!GENDERS.includes(patient.gender)) {
    throw new Error("Invalid new patient gender");
  }

  const normalizedMobile = String(patient.mobile || "").replace(/\D/g, "");

  if (normalizedMobile.length < 10 || normalizedMobile.length > 15) {
    throw new Error(
      "New patient mobile number must contain between 10 and 15 digits",
    );
  }

  return true;
};

const createAppointmentValidator = [
  body().custom((_value, { req }) => {
    const hasPatientId =
      typeof req.body.patientId === "string" &&
      req.body.patientId.trim().length > 0;

    const hasNewPatient =
      req.body.patient !== undefined && req.body.patient !== null;

    if (hasPatientId && hasNewPatient) {
      throw new Error(
        "Provide either patientId or new patient details, not both",
      );
    }

    if (!hasPatientId && !hasNewPatient) {
      throw new Error("Provide patientId or new patient details");
    }

    return true;
  }),

  body("patientId")
    .optional()
    .isMongoId()
    .withMessage("Invalid patient identifier"),

  body("patient").optional().custom(validateNewPatient),

  body("patient.name")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("New patient name cannot exceed 100 characters"),

  body("patient.mobile").optional().customSanitizer(normalizeMobile),

  body("patient.email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Enter a valid new patient email address")
    .normalizeEmail(),

  body("patient.address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("New patient address cannot exceed 500 characters"),

  body("patient.emergencyContact")
    .optional()
    .isObject()
    .withMessage("Emergency contact must be an object"),

  body("patient.emergencyContact.mobile")
    .optional({ checkFalsy: true })
    .customSanitizer(normalizeMobile)
    .isLength({ min: 10, max: 15 })
    .withMessage(
      "Emergency contact mobile must contain between 10 and 15 digits",
    ),

  body("doctorId")
    .notEmpty()
    .withMessage("Doctor is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid doctor identifier"),

  body("appointmentDate")
    .notEmpty()
    .withMessage("Appointment date is required")
    .bail()
    .matches(DATE_PATTERN)
    .withMessage("Appointment date must use YYYY-MM-DD format")
    .bail()
    .custom((value) => validateDate(value, "Appointment date")),

  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .bail()
    .matches(TIME_PATTERN)
    .withMessage("Start time must use HH:mm format"),

  body("reasonForVisit")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason for visit cannot exceed 500 characters"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Appointment notes cannot exceed 2000 characters"),
];

const listAppointmentsValidator = [
  query("doctor")
    .optional()
    .isMongoId()
    .withMessage("Invalid doctor identifier"),

  query("department")
    .optional()
    .isMongoId()
    .withMessage("Invalid department identifier"),

  query("patient")
    .optional()
    .isMongoId()
    .withMessage("Invalid patient identifier"),

  query("status")
    .optional()
    .isIn(Object.values(APPOINTMENT_STATUSES))
    .withMessage("Invalid appointment status"),

  query("date")
    .optional()
    .matches(DATE_PATTERN)
    .withMessage("Date must use YYYY-MM-DD format")
    .bail()
    .custom((value) => validateDate(value, "Date")),

  query("dateFrom")
    .optional()
    .matches(DATE_PATTERN)
    .withMessage("dateFrom must use YYYY-MM-DD format")
    .bail()
    .custom((value) => validateDate(value, "dateFrom")),

  query("dateTo")
    .optional()
    .matches(DATE_PATTERN)
    .withMessage("dateTo must use YYYY-MM-DD format")
    .bail()
    .custom((value) => validateDate(value, "dateTo")),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];

const appointmentIdValidator = [
  param("id").isMongoId().withMessage("Invalid appointment identifier"),
];

const updateAppointmentValidator = [
  ...appointmentIdValidator,

  body("doctorId")
    .optional()
    .isMongoId()
    .withMessage("Invalid doctor identifier"),

  body("appointmentDate")
    .optional()
    .matches(DATE_PATTERN)
    .withMessage("Appointment date must use YYYY-MM-DD format")
    .bail()
    .custom((value) => validateDate(value, "Appointment date")),

  body("startTime")
    .optional()
    .matches(TIME_PATTERN)
    .withMessage("Start time must use HH:mm format"),

  body("reasonForVisit")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Reason for visit cannot exceed 500 characters"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Appointment notes cannot exceed 2000 characters"),

  body().custom((_value, { req }) => {
    const allowedFields = [
      "doctorId",
      "appointmentDate",
      "startTime",
      "reasonForVisit",
      "notes",
    ];

    const hasUpdate = allowedFields.some(
      (field) => req.body[field] !== undefined,
    );

    if (!hasUpdate) {
      throw new Error("Provide at least one appointment field to update");
    }

    return true;
  }),
];

const cancelAppointmentValidator = [
  ...appointmentIdValidator,

  body("cancellationReason")
    .trim()
    .notEmpty()
    .withMessage("Cancellation reason is required")
    .bail()
    .isLength({ max: 500 })
    .withMessage("Cancellation reason cannot exceed 500 characters"),
];

const completeAppointmentValidator = appointmentIdValidator;

module.exports = {
  createAppointmentValidator,
  listAppointmentsValidator,
  appointmentIdValidator,
  updateAppointmentValidator,
  cancelAppointmentValidator,
  completeAppointmentValidator,
};
