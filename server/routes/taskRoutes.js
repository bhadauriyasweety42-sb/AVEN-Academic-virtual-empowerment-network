const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE TASK
router.post("/", authMiddleware, async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      userId: req.userId,
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create task",
      error: error.message,
    });
  }
});

// GET LOGGED-IN USER'S TASKS
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.userId,
    }).sort({ deadline: 1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
});

// UPDATE TASK
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update task",
      error: error.message,
    });
  }
});

// DELETE TASK
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete task",
      error: error.message,
    });
  }
});

module.exports = router;