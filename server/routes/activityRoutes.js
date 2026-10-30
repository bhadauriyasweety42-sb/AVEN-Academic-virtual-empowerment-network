
const express = require("express");
const Activity = require("../models/Activity");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE ACTIVITY
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      type,
      title,
      subject,
      date,
      deadline,
      startTime,
      endTime,
      time,
      location,
      description,
      topic,
      duration,
      priority,
      submissionLink,
    } = req.body;

    // Validate required fields
    if (
      !type ||
      !title ||
      !title.trim() ||
      !date
    ) {
      return res.status(400).json({
        message: "Type, title and date are required.",
      });
    }

    const activity = await Activity.create({
      userId: req.userId,
      type,
      title: title.trim(),
      subject,
      date,
      deadline: deadline || null,
      startTime,
      endTime,
      time,
      location,
      description,
      topic,
      duration,
      priority,
      submissionLink,
    });

    return res.status(201).json({
      message: "Activity saved successfully!",
      activity,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Create activity error:", error);

    return res.status(500).json({
      message: "Failed to save activity.",
    });
  }
});

// GET ACTIVITIES FOR THE LOGGED-IN STUDENT


 // GET ACTIVITIES FOR THE LOGGED-IN STUDENT
router.get("/", authMiddleware, async (req, res) => {
  try {
    const activities = await Activity.find({
      userId: req.userId,
    }).sort({ date: 1, createdAt: -1 });

    return res.status(200).json(activities);
  } catch (error) {
    console.error("Fetch activities error:", error);

    return res.status(500).json({
      message: "Failed to fetch activities.",
    });
  }
});

 // UPDATE ACTIVITY STATUS
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "completed"].includes(status)) {
      return res.status(400).json({
        message: "Status must be pending or completed.",
      });
    }

    const activity = await Activity.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId,
      },
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!activity) {
      return res.status(404).json({
        message: "Activity not found.",
      });
    }

    return res.status(200).json({
      message: "Activity status updated successfully!",
      activity,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid activity ID.",
      });
    }

    console.error("Update activity error:", error);

    return res.status(500).json({
      message: "Failed to update activity status.",
    });
  }
});


module.exports = router;
