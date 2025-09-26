const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { PERMISSIONS, ROLES } = require('../constants/roles');

// POST /api/tasks - Create a new task
router.post('/', auth, requireRole.requirePermission(PERMISSIONS.CREATE_TASKS), async (req, res) => {
  const { eventId, title, description, assignedTo, status, deadline } = req.body;
  if (!eventId || !title) {
    return res.status(400).json({ message: 'eventId and title are required' });
  }
  try {
    const task = new Task({ eventId, title, description, assignedTo, status, deadline });
    await task.save();
    res.status(201).json({ message: 'Task created', task });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/:eventId - List all tasks for an event
router.get('/:eventId', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ eventId: req.params.eventId })
      .populate('assignedTo', 'name');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', auth, async (req, res) => {
  const { title, description, assignedTo, status, deadline } = req.body;
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, assignedTo, status, deadline },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task updated', task });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 