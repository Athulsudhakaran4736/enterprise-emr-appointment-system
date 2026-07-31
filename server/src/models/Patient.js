const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
      maxlength: [120, "Patient name cannot exceed 120 characters"],
      index: true,
    },

    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      index: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER", "NOT_SPECIFIED"],
      default: "NOT_SPECIFIED",
    },

    address: {
      line1: {
        type: String,
        trim: true,
        default: "",
      },

      line2: {
        type: String,
        trim: true,
        default: "",
      },

      city: {
        type: String,
        trim: true,
        default: "",
      },

      state: {
        type: String,
        trim: true,
        default: "",
      },

      postalCode: {
        type: String,
        trim: true,
        default: "",
      },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

patientSchema.index({
  patientId: 1,
});

patientSchema.index({
  mobile: 1,
  isActive: 1,
});

patientSchema.index({
  name: 1,
  isActive: 1,
});

module.exports = mongoose.model("Patient", patientSchema);
