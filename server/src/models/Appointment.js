const mongoose = require("mongoose");

const APPOINTMENT_STATUSES = require("../constants/appointmentStatus");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },

    appointmentDate: {
      type: String,
      required: true,
      match: [DATE_PATTERN, "Appointment date must use YYYY-MM-DD format"],
    },

    startTime: {
      type: String,
      required: true,
      match: [TIME_PATTERN, "Appointment start time must use HH:mm format"],
    },

    endTime: {
      type: String,
      required: true,
      match: [TIME_PATTERN, "Appointment end time must use HH:mm format"],
    },

    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUSES),
      default: APPOINTMENT_STATUSES.SCHEDULED,
      index: true,
    },

    /*
     * This field is used by the partial unique index.
     *
     * SCHEDULED and ARRIVED appointments block the slot.
     * CANCELLED appointments do not block the slot.
     */
    isActiveBooking: {
      type: Boolean,
      default: true,
      required: true,
    },

    reasonForVisit: {
      type: String,
      trim: true,
      maxlength: [500, "Reason for visit cannot exceed 500 characters"],
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Appointment notes cannot exceed 2000 characters"],
      default: "",
    },

    arrivedAt: {
      type: Date,
      default: null,
    },

    arrivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * Final concurrency protection.
 *
 * Only one active appointment can occupy the same doctor, date and start time.
 *
 * Cancelled appointments use isActiveBooking: false, so the same slot can
 * later be booked again while preserving the cancelled appointment history.
 */
appointmentSchema.index(
  {
    doctor: 1,
    appointmentDate: 1,
    startTime: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isActiveBooking: true,
    },
    name: "unique_active_doctor_appointment_slot",
  },
);

appointmentSchema.index({
  doctor: 1,
  appointmentDate: 1,
  status: 1,
  startTime: 1,
});

appointmentSchema.index({
  patient: 1,
  appointmentDate: -1,
});

appointmentSchema.index({
  department: 1,
  appointmentDate: 1,
});

appointmentSchema.index({
  status: 1,
  appointmentDate: 1,
});

appointmentSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();

    delete returnedObject._id;
    delete returnedObject.__v;

    return returnedObject;
  },
});

module.exports = mongoose.model("Appointment", appointmentSchema);
