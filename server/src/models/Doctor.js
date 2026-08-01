const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
      index: true,
    },

    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
      maxlength: [150, "Specialization cannot exceed 150 characters"],
    },

    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      trim: true,
      uppercase: true,
      unique: true,
    },

    qualification: {
      type: String,
      trim: true,
      maxlength: [250, "Qualification cannot exceed 250 characters"],
      default: "",
    },

    consultationDuration: {
      type: Number,
      min: [5, "Consultation duration must be at least 5 minutes"],
      max: [180, "Consultation duration cannot exceed 180 minutes"],
      default: 15,
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

doctorSchema.index({
  department: 1,
  isActive: 1,
});

doctorSchema.index({
  specialization: 1,
  isActive: 1,
});

module.exports = mongoose.model("Doctor", doctorSchema);
