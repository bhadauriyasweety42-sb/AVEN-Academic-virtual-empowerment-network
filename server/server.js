const {
  startClassReminderScheduler,
} = require("./services/classReminderScheduler");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const activityRoutes = require("./routes/activityRoutes");
const focusRoutes = require("./routes/focusRoutes");
const avatar3DRoutes = require("./routes/avatar3DRoutes");
const aiRoutes = require("./routes/aiRoutes");
const academicPlannerRoutes = require("./routes/academicPlannerRoutes");
const timetableRoutes = require("./routes/timetableRoutes");



console.log("authRoutes:", typeof authRoutes);
console.log("taskRoutes:", typeof taskRoutes);
console.log("activityRoutes:", typeof activityRoutes);
console.log("focusRoutes:", typeof focusRoutes);
console.log("aiRoutes:", typeof aiRoutes);
// const aiRoutes = require("./routes/aiRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/focus", focusRoutes);
app.use("/api/avatar3d", avatar3DRoutes);

app.use("/api/ai", aiRoutes);
app.use("/api/planner", academicPlannerRoutes);
app.use("/api/timetable", timetableRoutes);


// Test route
app.get("/", (req, res) => {
  res.send("AI Student Manager Backend is Running!");
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    startClassReminderScheduler();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });