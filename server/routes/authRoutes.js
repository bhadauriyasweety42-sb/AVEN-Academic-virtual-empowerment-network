const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");


const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Create new user
   const hashedPassword = await bcrypt.hash(password, 10);

const user = await User.create({
  name,
  email,
  password: hashedPassword,
});

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Signup failed",
      error: error.message,
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Compare entered password with hashed password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

const token = jwt.sign(
  {
    userId: user._id,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "7d",
  }
);


res.status(200).json({
  message: "Login successful",
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    college: user.college,
    branch: user.branch,
    year: user.year,
    semester: user.semester,
    careerGoal: user.careerGoal,
    studyBuddy: user.studyBuddy,
    availableHours: user.availableHours,
    preferredStudyTime: user.preferredStudyTime,
  },
});

  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

// Get the logged-in student's profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
});

// Update the logged-in student's profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      college,
      branch,
      year,
      semester,
      careerGoal,
      availableHours,
      preferredStudyTime,
    } = req.body;

    const updates = {};

    if (typeof name === "string") updates.name = name.trim();
    if (typeof college === "string") updates.college = college.trim();
    if (typeof branch === "string") updates.branch = branch.trim();
    if (typeof careerGoal === "string") updates.careerGoal = careerGoal.trim();
    if (typeof preferredStudyTime === "string") {
      updates.preferredStudyTime = preferredStudyTime;
    }

    if (year !== undefined) {
      const value = Number(year);
      if (!Number.isInteger(value) || value < 1 || value > 6) {
        return res.status(400).json({ message: "Invalid year" });
      }
      updates.year = value;
    }

    if (semester !== undefined) {
      const value = Number(semester);
      if (!Number.isInteger(value) || value < 1 || value > 12) {
        return res.status(400).json({ message: "Invalid semester" });
      }
      updates.semester = value;
    }

    if (availableHours !== undefined) {
      const value = Number(availableHours);
      if (!Number.isFinite(value) || value < 0 || value > 24) {
        return res.status(400).json({
          message: "Available hours must be between 0 and 24",
        });
      }
      updates.availableHours = value;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

// Protected test route
router.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You have access to this protected route!",
    userId: req.userId,
  });
});

module.exports = router;