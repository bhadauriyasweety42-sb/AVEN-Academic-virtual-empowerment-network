const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Create task
router.post('/', async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all tasks
router.get('/', async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

module.exports = router;


const { createTask, getTasks } = require('../controllers/taskController');
router.post('/', createTask);
router.get('/', getTasks);
