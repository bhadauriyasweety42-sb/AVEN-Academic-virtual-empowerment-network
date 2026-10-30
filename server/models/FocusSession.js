
const mongoose = require("mongoose");

const focusSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    taskTitle: {
      type: String,
      trim: true,
      default: "General Focus",
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 180,
    },

    status: {
      type: String,
      enum: ["completed"],
      default: "completed",
    },

    startedAt: {
      type: Date,
      required: true,
    },

    completedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FocusSession", focusSessionSchema);
