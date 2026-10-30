
const express = require("express");
const mongoose = require("mongoose");
const FocusSession = require("../models/FocusSession");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// SAVE A COMPLETED FOCUS SESSION
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      taskId,
      taskTitle,
      durationMinutes,
      startedAt,
      completedAt,
    } = req.body;

    const duration = Number(durationMinutes);
    const start = new Date(startedAt);
    const end = new Date(completedAt);

    if (
      !Number.isFinite(duration) ||
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 180
    ) {
      return res.status(400).json({
        message: "Duration must be between 1 and 180 whole minutes.",
      });
    }

    if (
      !startedAt ||
      !completedAt ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return res.status(400).json({
        message: "Valid session start and completion times are required.",
      });
    }

    // Do not accept a claimed duration that greatly exceeds elapsed time.
    const elapsedMinutes = (end - start) / 60000;

    if (elapsedMinutes < duration - 1) {
      return res.status(400).json({
        message: "The recorded session duration does not match its timestamps.",
      });
    }

    let savedTaskId = null;
    let savedTaskTitle = "General Focus";

    if (taskId) {
      if (!mongoose.isValidObjectId(taskId)) {
        return res.status(400).json({
          message: "Invalid task ID.",
        });
      }

      const task = await Task.findOne({
        _id: taskId,
        userId: req.userId,
      });

      if (!task) {
        return res.status(404).json({
          message: "Task not found.",
        });
      }

      savedTaskId = task._id;
      savedTaskTitle = task.title;
    } else if (typeof taskTitle === "string" && taskTitle.trim()) {
      savedTaskTitle = taskTitle.trim().slice(0, 150);
    }

    const session = await FocusSession.create({
      userId: req.userId,
      taskId: savedTaskId,
      taskTitle: savedTaskTitle,
      durationMinutes: duration,
      startedAt: start,
      completedAt: end,
      status: "completed",
    });

    res.status(201).json({
      message: "Focus session saved successfully.",
      session,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save focus session.",
      error: error.message,
    });
  }
});

// GET LOGGED-IN USER'S FOCUS HISTORY
router.get("/", authMiddleware, async (req, res) => {
  try {
    const sessions = await FocusSession.find({
      userId: req.userId,
    }).sort({ completedAt: -1 });

    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch focus history.",
      error: error.message,
    });
  }
});

module.exports = router;
