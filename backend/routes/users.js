const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { PERMISSIONS, ROLES } = require('../constants/roles');
const config = require('../config/config');
const { validatePassword, hashPassword } = require('../utils/password');
const { AppError, ValidationError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { validateRequest } = require('../middleware/validation');

/* GET users listing with pagination */
router.get('/', auth, requireRole.requirePermission(PERMISSIONS.VIEW_USERS), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || config.pagination.defaultLimit, config.pagination.maxLimit);
    const skip = (page - 1) * limit;

    // Build query filters
    const filters = {};
    if (req.query.search) {
      filters.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.isActive !== undefined) {
      filters.isActive = req.query.isActive === 'true';
    }

    const [users, total] = await Promise.all([
      User.find(filters)
        .select('-password -loginAttempts -lockUntil') // Exclude sensitive fields
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filters)
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/users - Create a new user (admin only)
router.post('/', auth, requireRole.requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  const { name, email, password, events } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, events: events || [] });
    await user.save();
    res.status(201).json({ message: 'User created', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/:id - Update a user (admin only)
router.put('/:id', auth, requireRole.requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  const { name, email, events } = req.body;
  const { id } = req.params;
  
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already exists' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    if (events) user.events = events;
    
    await user.save();
    res.json({ message: 'User updated', user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/:id - Delete a user (admin only)
router.delete('/:id', auth, requireRole.requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  const { id } = req.params;
  
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/admin - Get users for admin dashboard (with populated events)
router.get('/admin', auth, requireRole.requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('events.eventId', 'title');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me - Get current user's info and assigned tasks
router.get('/me', auth, async (req, res) => {
  try {
    // Populate eventId in user's events array
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('events.eventId', 'title');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get all tasks assigned to this user
    const Task = require('../models/Task');
    const tasks = await Task.find({ assignedTo: user._id });

    res.json({ user, assignedTasks: tasks });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
