const mongoose = require("mongoose");

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const breakSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      match: [TIME_PATTERN, "Break start time must use HH:mm format"],
    },

    endTime: {
      type: String,
      required: true,
      match: [TIME_PATTERN, "Break end time must use HH:mm format"],
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
      match: [TIME_PATTERN, "Session start time must use HH:mm format"],
    },

    endTime: {
      type: String,
      required: true,
      match: [TIME_PATTERN, "Session end time must use HH:mm format"],
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
      default: 15,
    },

    timezone: {
      type: String,
      required: true,
      trim: true,
      default: "Asia/Kolkata",
    },

    effectiveFrom: {
      type: String,
      required: true,
      match: [DATE_PATTERN, "effectiveFrom must use YYYY-MM-DD format"],
    },

    effectiveTo: {
      type: String,
      default: null,
      match: [DATE_PATTERN, "effectiveTo must use YYYY-MM-DD format"],
    },

    isActive: {
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
  },
  {
    timestamps: true,
  },
);

doctorScheduleSchema.index({
  doctor: 1,
  isActive: 1,
  effectiveFrom: 1,
  effectiveTo: 1,
});

doctorScheduleSchema.index({
  doctor: 1,
  createdAt: -1,
});

doctorScheduleSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();

    delete returnedObject._id;
    delete returnedObject.__v;

    return returnedObject;
  },
});

module.exports = mongoose.model("DoctorSchedule", doctorScheduleSchema);
