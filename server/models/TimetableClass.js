
const mongoose = require("mongoose");

const timetableClassSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "User",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: true, // "HH:mm", 24-hour format
    },
    endTime: {
      type: String,
      required: true,
    },
    room: {
      type: String,
      default: "",
    },
    faculty: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
    sentReminderKeys: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.TimetableClass ||
  mongoose.model("TimetableClass", timetableClassSchema);
