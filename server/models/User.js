const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    college: {
      type: String,
      default: "",
    },

    branch: {
      type: String,
      default: "",
    },

    year: {
      type: Number,
      default: 1,
    },

    semester: {
      type: Number,
      default: 1,
    },

    careerGoal: {
      type: String,
      default: "",
    },

    studyBuddy: {
      type: String,
      default: "",
    },

    availableHours: {
      type: Number,
      default: 0,
    },

    preferredStudyTime: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);