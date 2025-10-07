const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const User = require('../models/User');
const Event = require('../models/Event');
const Task = require('../models/Task');
const ArchiveLink = require('../models/ArchiveLink');
const { PERMISSIONS, ROLES } = require('../constants/roles');
const config = require('../config/config');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const scheduledTasksService = require('../services/scheduledTasks');
const { deleteUserWithRelatedData } = require('../utils/transactions');

// GET /api/admin/roles - Get available roles and their labels (public for authenticated users)
router.get('/roles', auth, async (req, res) => {
  try {
    // Role labels for display
    const roleLabels = {
      [ROLES.VOLUNTEER]: 'Volunteer',
      [ROLES.TEAM_MEMBER]: 'Team Member',
      [ROLES.EVENT_COORDINATOR]: 'Event Coordinator',
      [ROLES.TE_HEAD]: 'Technical Head',
      [ROLES.BE_HEAD]: 'Backend Head',
      [ROLES.ADMIN]: 'Administrator'
    };

    // Create available roles array ordered by hierarchy
    const availableRoles = [
      { value: ROLES.VOLUNTEER, label: roleLabels[ROLES.VOLUNTEER] },
      { value: ROLES.TEAM_MEMBER, label: roleLabels[ROLES.TEAM_MEMBER] },
      { value: ROLES.EVENT_COORDINATOR, label: roleLabels[ROLES.EVENT_COORDINATOR] },
      { value: ROLES.TE_HEAD, label: roleLabels[ROLES.TE_HEAD] },
      { value: ROLES.BE_HEAD, label: roleLabels[ROLES.BE_HEAD] },
      { value: ROLES.ADMIN, label: roleLabels[ROLES.ADMIN] }
    ];

    res.json({
      roles: ROLES,
      roleLabels,
      availableRoles
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
});

// GET /api/admin/dashboard - Get admin dashboard statistics
router.get('/dashboard', auth, requireRole.requirePermission(PERMISSIONS.SYSTEM_ADMIN), async (req, res) => {
  try {
    // Get counts
    const userCount = await User.countDocuments();
    const eventCount = await Event.countDocuments();
    const taskCount = await Task.countDocuments();
    const archiveCount = await ArchiveLink.countDocuments();

    // Get recent activities
    const recentUsers = await User.find()
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentEvents = await Event.find()
      .select('title description createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentTasks = await Task.find()
      .populate('assignedTo', 'name')
      .populate('eventId', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get task statistics by status
    const taskStats = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get user statistics by role
    const userStats = await User.aggregate([
      { $unwind: '$events' },
      {
        $group: {
          _id: '$events.role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      statistics: {
        users: userCount,
        events: eventCount,
        tasks: taskCount,
        archives: archiveCount
      },
      recentActivities: {
        users: recentUsers,
        events: recentEvents,
        tasks: recentTasks
      },
      taskStats,
      userStats
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/users - Get all users with their event assignments
router.get('/users', auth, requireRole.requirePermission(PERMISSIONS.MANAGE_USERS), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('events.eventId', 'title');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/events - Get all events with their user assignments
router.get('/events', auth, requireRole.hasManagementRole, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('users.userId', 'name email');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/tasks - Get all tasks with assignments
router.get('/tasks', auth, requireRole.hasManagementRole, async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'name email')
      .populate('eventId', 'title');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/archives - Get all archive links
router.get('/archives', auth, requireRole.hasManagementRole, async (req, res) => {
  try {
    const archives = await ArchiveLink.find()
      .populate('eventId', 'title');
    res.json(archives);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/system/tasks - Get scheduled task status
router.get('/system/tasks', auth, requireRole.requirePermission(PERMISSIONS.SYSTEM_ADMIN), async (req, res, next) => {
  try {
    const taskStatus = scheduledTasksService.getTaskStatus();
    
    res.json({
      message: 'Scheduled tasks status retrieved successfully',
      ...taskStatus,
      serverTime: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/system/tasks/:taskName/run - Manually run a scheduled task
router.post('/system/tasks/:taskName/run', auth, requireRole.requirePermission(PERMISSIONS.SYSTEM_ADMIN), async (req, res, next) => {
  try {
    const { taskName } = req.params;
    
    await scheduledTasksService.runTask(taskName);
    
    logger.info('Manual task execution', {
      taskName,
      executedBy: req.user.userId,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: `Task ${taskName} executed successfully`,
      taskName,
      executedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/system/tasks/:taskId/execute - Alias for manual task execution
router.post('/system/tasks/:taskId/execute', auth, requireRole.requirePermission(PERMISSIONS.SYSTEM_ADMIN), async (req, res, next) => {
  try {
    const { taskId } = req.params;
    
    // Map frontend task IDs to backend task names
    const taskMapping = {
      'update_event_status': 'updateEventStatus',
      'cleanup_logs': 'cleanupLogs', 
      'generate_reports': 'generateReports',
      'backup_database': 'backupDatabase'
    };

    const taskName = taskMapping[taskId];
    if (!taskName) {
      return res.status(400).json({ message: `Unknown task ID: ${taskId}` });
    }
    
    await scheduledTasksService.runTask(taskName);
    
    logger.info('Manual task execution via alias', {
      taskId,
      taskName,
      executedBy: req.user.userId,
      timestamp: new Date().toISOString()
    });

    res.json({
      message: `Task ${taskName} executed successfully`,
      taskId,
      taskName,
      executedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/system/health - System health check
router.get('/system/health', auth, requireRole.requirePermission(PERMISSIONS.SYSTEM_ADMIN), async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Check event status consistency
    const { getEventsNeedingStatusUpdate } = require('../utils/eventUtils');
    const { eventsToComplete, eventsToActivate } = await getEventsNeedingStatusUpdate();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        name: mongoose.connection.name || 'unknown'
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
      },
      scheduledTasks: scheduledTasksService.getTaskStatus(),
      eventStatusIssues: {
        eventsNeedingCompletion: eventsToComplete.length,
        eventsNeedingActivation: eventsToActivate.length
      },
      nodeVersion: process.version,
      environment: config.server.nodeEnv
    };

    // Set status based on issues
    if (dbStatus !== 'connected' || eventsToComplete.length > 10 || eventsToActivate.length > 10) {
      health.status = 'degraded';
    }

    res.json(health);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/system/activity - Recent system activities
router.get('/system/activity', auth, requireRole.requirePermission(PERMISSIONS.SYSTEM_ADMIN), async (req, res, next) => {
  try {
    // Get recent activities from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const activities = [];

    // Recent user logins (from today)
    const recentUsers = await User.find({ 
      lastLogin: { $gte: twentyFourHoursAgo } 
    }).select('name email lastLogin').limit(10);

    recentUsers.forEach(user => {
      activities.push({
        type: 'user_login',
        message: `${user.name} logged in`,
        timestamp: user.lastLogin,
        userId: user._id,
        userEmail: user.email
      });
    });

    // Recent events created
    const recentEvents = await Event.find({ 
      createdAt: { $gte: twentyFourHoursAgo } 
    }).select('title createdAt').limit(10);

    recentEvents.forEach(event => {
      activities.push({
        type: 'event_created',
        message: `Event "${event.title}" was created`,
        timestamp: event.createdAt,
        eventId: event._id
      });
    });

    // Recent tasks completed
    const recentTasks = await Task.find({ 
      status: 'done',
      updatedAt: { $gte: twentyFourHoursAgo }
    }).populate('eventId', 'title').select('title updatedAt eventId').limit(10);

    recentTasks.forEach(task => {
      activities.push({
        type: 'task_completed',
        message: `Task "${task.title}" completed${task.eventId ? ` for event "${task.eventId.title}"` : ''}`,
        timestamp: task.updatedAt,
        taskId: task._id
      });
    });

    // Sort activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      activities: activities.slice(0, 20), // Limit to 20 most recent
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/system/stats - System statistics
router.get('/system/stats', auth, requireRole.requirePermission(PERMISSIONS.SYSTEM_ADMIN), async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalStats,
      recentStats,
      weekStats,
      dailyStats,
      eventStatusStats
    ] = await Promise.all([
      // Total counts
      Promise.all([
        User.countDocuments(),
        Event.countDocuments(),
        Task.countDocuments(),
        ArchiveLink.countDocuments()
      ]),
      
      // Last 30 days
      Promise.all([
        User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Event.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
        Task.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
      ]),
      
      // Last 7 days
      Promise.all([
        User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        Event.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        Task.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
      ]),
      
      // Last 24 hours
      Promise.all([
        User.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
        Event.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
        Task.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } })
      ]),
      
      // Event status breakdown
      Event.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const [totalUsers, totalEvents, totalTasks, totalArchives] = totalStats;
    const [newUsers30d, newEvents30d, newTasks30d] = recentStats;
    const [newUsers7d, newEvents7d, newTasks7d] = weekStats;
    const [newUsers24h, newEvents24h, newTasks24h] = dailyStats;

    res.json({
      totals: {
        users: totalUsers,
        events: totalEvents,
        tasks: totalTasks,
        archives: totalArchives
      },
      recent: {
        last30Days: {
          users: newUsers30d,
          events: newEvents30d,
          tasks: newTasks30d
        },
        last7Days: {
          users: newUsers7d,
          events: newEvents7d,
          tasks: newTasks7d
        },
        last24Hours: {
          users: newUsers24h,
          events: newEvents24h,
          tasks: newTasks24h
        }
      },
      eventsByStatus: eventStatusStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      generatedAt: now.toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users - Get all users with filtering and pagination
router.get('/users', auth, requireRole.requirePermission(PERMISSIONS.SYSTEM_ADMIN), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build filter query
    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && role !== 'all') {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(offset)
      .exec();

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users - Create new user (admin only)
router.post('/users', auth, requireRole.requirePermission(PERMISSIONS.SYSTEM_ADMIN), async (req, res) => {
  try {
    const { name, email, password, role = 'volunteer' } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Validate role
    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Import password utilities
    const { hashPassword, validatePassword } = require('../utils/password');

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: 'Password does not meet security requirements',
        details: passwordValidation.errors
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      isActive: true
    });

    await user.save();

    // Log the action
    logger.info('Admin created new user', {
      adminId: req.user.id,
      adminEmail: req.user.email,
      newUserId: user._id,
      newUserEmail: user.email,
      role,
      ip: req.ip
    });

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id - Update user (admin only)
router.put('/users/:id', auth, requireRole.requirePermission(PERMISSIONS.SYSTEM_ADMIN), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate role if provided
    if (role) {
      const validRoles = Object.values(ROLES);
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
      }
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use by another user' });
      }
    }

    // Update fields
    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    // Log the action
    logger.info('Admin updated user', {
      adminId: req.user.id,
      updatedUserId: user._id,
      changes: req.body,
      ip: req.ip
    });

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id - Delete user (admin only)
router.delete('/users/:id', auth, requireRole.requirePermission(PERMISSIONS.SYSTEM_ADMIN), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found. They may have already been deleted.' });
    }

    // Delete user and cleanup related data atomically using transaction
    const result = await deleteUserWithRelatedData(id, req.user);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router; 