const mongoose = require("mongoose");

const APPOINTMENT_STATUS = require("../constants/appointmentStatus");

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const appointmentSchema = new mongoose.Schema(
  {
    appointmentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

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
      type: Date,
      required: true,
      index: true,
    },

    slotStart: {
      type: String,
      required: true,
      match: [timePattern, "Slot start must use HH:mm format"],
    },

    slotEnd: {
      type: String,
      required: true,
      match: [timePattern, "Slot end must use HH:mm format"],
    },

    purpose: {
      type: String,
      required: [true, "Appointment purpose is required"],
      trim: true,
      maxlength: [500, "Purpose cannot exceed 500 characters"],
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
      default: "",
    },

    consultationNotes: {
      type: String,
      trim: true,
      maxlength: [5000, "Consultation notes cannot exceed 5000 characters"],
      default: "",
    },

    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.SCHEDULED,
      index: true,
    },

    isActiveSlot: {
      type: Boolean,
      default: true,
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

    arrivedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

/*
 * Final database-level protection against double booking.
 * Cancelled appointments must have isActiveSlot set to false.
 */
appointmentSchema.index(
  {
    doctor: 1,
    appointmentDate: 1,
    slotStart: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isActiveSlot: true,
    },
    name: "unique_active_doctor_slot",
  },
);

appointmentSchema.index({
  doctor: 1,
  appointmentDate: 1,
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

module.exports = mongoose.model("Appointment", appointmentSchema);
