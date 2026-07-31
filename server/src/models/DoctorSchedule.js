const mongoose = require("mongoose");

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const breakSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      match: [timePattern, "Break start time must use HH:mm format"],
    },

    endTime: {
      type: String,
      required: true,
      match: [timePattern, "Break end time must use HH:mm format"],
    },
  },
  {
    _id: false,
  },
);

const sessionSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      match: [timePattern, "Session start time must use HH:mm format"],
    },

    endTime: {
      type: String,
      required: true,
      match: [timePattern, "Session end time must use HH:mm format"],
    },

    breaks: {
      type: [breakSchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const workingDaySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },

    isWorking: {
      type: Boolean,
      default: true,
    },

    sessions: {
      type: [sessionSchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    workingDays: {
      type: [workingDaySchema],
      required: true,
    },

    slotDurationMinutes: {
      type: Number,
      required: true,
      min: [5, "Slot duration must be at least 5 minutes"],
      max: [180, "Slot duration cannot exceed 180 minutes"],
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    effectiveFrom: {
      type: Date,
      required: true,
    },

    effectiveTo: {
      type: Date,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

doctorScheduleSchema.index({
  doctor: 1,
  isActive: 1,
});

doctorScheduleSchema.index({
  doctor: 1,
  effectiveFrom: 1,
  effectiveTo: 1,
});

module.exports = mongoose.model("DoctorSchedule", doctorScheduleSchema);
