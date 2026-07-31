const mongoose = require("mongoose");

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Emergency contact name cannot exceed 100 characters"],
      default: "",
    },

    relationship: {
      type: String,
      trim: true,
      maxlength: [50, "Relationship cannot exceed 50 characters"],
      default: "",
    },

    mobile: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  },
);

const patientSchema = new mongoose.Schema(
  {
    patientNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
      maxlength: [100, "Patient name cannot exceed 100 characters"],
    },

    dateOfBirth: {
      type: String,
      required: [true, "Date of birth is required"],
      match: [DATE_PATTERN, "Date of birth must use YYYY-MM-DD format"],
    },

    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: {
        values: ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"],
        message: "Invalid gender",
      },
    },

    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
      default: "",
    },

    emergencyContact: {
      type: emergencyContactSchema,
      default: () => ({
        name: "",
        relationship: "",
        mobile: "",
      }),
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

patientSchema.index({
  mobile: 1,
  isActive: 1,
});

patientSchema.index({
  name: 1,
  isActive: 1,
});

patientSchema.index({
  createdAt: -1,
});

patientSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();

    delete returnedObject._id;
    delete returnedObject.__v;

    return returnedObject;
  },
});

module.exports = mongoose.model("Patient", patientSchema);
