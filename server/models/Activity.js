
const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    // The student who owns this activity
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // One of the six activity types
    type: {
      type: String,
      enum: [
        "class",
        "exam",
        "assignment",
        "study",
        "project",
        "other",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    subject: {
      type: String,
      default: "",
      trim: true,
    },

    // Activity date and optional deadline
    date: {
      type: String,
      required: true,
    },

    deadline: {
      type: Date,
      default: null,
    },

    // Timetable information
    startTime: {
      type: String,
      default: "",
    },

    endTime: {
      type: String,
      default: "",
    },

    time: {
      type: String,
      default: "",
    },

    // Additional activity details
    location: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    topic: {
      type: String,
      default: "",
      trim: true,
    },

    duration: {
      type: Number,
      default: 0,
      min: 0,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    submissionLink: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Activity",
  activitySchema
);
