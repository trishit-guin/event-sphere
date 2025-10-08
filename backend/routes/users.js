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
const { deleteUserWithRelatedData } = require('../utils/transactions');

// GET /api/users/test - Test auth and user retrieval
router.get('/test', auth, async (req, res) => {
  try {
    console.log('Test endpoint - req.user:', req.user);
    res.json({
      message: 'Auth test successful',
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email
    });
  } catch (err) {
    console.error('Test endpoint error:', err);
    res.status(500).json({ message: 'Test failed', error: err.message });
  }
});

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
    if (existing) return res.status(400).json({ message: 'A user with this email address already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, events: events || [] });
    await user.save();
    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    logger.error('User creation error:', err);
    res.status(500).json({ message: 'Failed to create user. Please try again later.' });
  }
});

// PUT /api/users/profile - Update own profile (name, email)
router.put('/profile', auth, async (req, res) => {
  const { name, email } = req.body;
  
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate inputs
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Name is required' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    // Check if email is being changed and if it's already taken
    if (email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use by another account' });
      }
    }

    user.name = name.trim();
    user.email = email.trim().toLowerCase();
    
    await user.save();
    
    const updatedUser = user.toObject();
    delete updatedUser.password;
    
    res.json({ 
      message: 'Profile updated successfully', 
      user: updatedUser 
    });
  } catch (err) {
    logger.error('Profile update error:', err);
    res.status(500).json({ 
      message: 'Failed to update profile. Please try again.'
    });
  }
});

// PUT /api/users/password - Change own password
router.put('/password', auth, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    logger.error('Password change error:', err);
    res.status(500).json({ message: 'Failed to change password. Please try again.' });
  }
});

// PUT /api/users/:id - Update a user (admin only)
router.put('/:id', auth, requireRole.requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  const { name, email, events } = req.body;
  const { id } = req.params;
  
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found. They may have been deleted.' });

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'This email address is already in use by another user' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    if (events) user.events = events;
    
    await user.save();
    res.json({ message: 'User updated successfully', user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    logger.error('User update error:', err);
    res.status(500).json({ message: 'Failed to update user. Please try again later.' });
  }
});

// DELETE /api/users/:id - Delete a user (admin only)
router.delete('/:id', auth, requireRole.requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  const { id } = req.params;
  
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found. They may have already been deleted.' });

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account. Please ask another administrator.' });
    }

    // Delete user and cleanup related data atomically using transaction
    const result = await deleteUserWithRelatedData(id, req.user);
    res.json(result);
  } catch (err) {
    logger.error('User deletion error:', err);
    res.status(500).json({ message: 'Failed to delete user. Please try again later.' });
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
    logger.error('Failed to fetch admin users:', err);
    res.status(500).json({ message: 'Failed to load users. Please refresh the page.' });
  }
});

// GET /api/users/me - Get current user's info and assigned tasks
router.get('/me', auth, async (req, res) => {
  try {
    // Populate eventId in user's events array
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('events.eventId', 'title');
    if (!user) return res.status(404).json({ message: 'Your user account could not be found. Please log in again.' });

    // Get all tasks assigned to this user
    const Task = require('../models/Task');
    const tasks = await Task.find({ assignedTo: user._id });

    res.json({ user, assignedTasks: tasks });
  } catch (err) {
    logger.error('Failed to fetch current user:', err);
    res.status(500).json({ message: 'Failed to load your profile. Please refresh the page.' });
  }
});

module.exports = router;
