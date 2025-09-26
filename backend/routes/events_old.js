const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { PERMISSIONS, ROLES } = require('../constants/roles');
const config = require('../config/config');
const { AppError, ValidationError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { validateRequest } = require('../middleware/validation');
const { 
  validateEventDates, 
  determineEventStatus, 
  validateStatusTransition, 
  canModifyEventDates 
} = require('../utils/eventUtils');

// Validation rules for event creation
const createEventValidation = {
  title: { required: true, minLength: 3, maxLength: 100 },
  description: { required: true, minLength: 10, maxLength: 1000 },
  startDate: { required: true, type: 'date' },
  endDate: { required: true, type: 'date' },
  location: { maxLength: 200 },
  maxParticipants: { type: 'number', min: 1, max: config.limits.maxUsersPerEvent },
  roles: { required: true, type: 'array', minLength: 1 }
};

// POST /api/events - Create a new event
router.post('/', auth, requireRole.requirePermission(PERMISSIONS.CREATE_EVENTS), validateRequest(createEventValidation), async (req, res, next) => {
  try {
    const { title, description, startDate, endDate, location, maxParticipants, roles, users } = req.body;

    // Validate dates
    const validatedDates = validateEventDates(startDate, endDate);

    // Determine initial status
    const status = req.body.status === config.eventStatus.DRAFT ? 
      config.eventStatus.DRAFT : 
      determineEventStatus({ 
        startDate: validatedDates.startDate, 
        endDate: validatedDates.endDate, 
        status: config.eventStatus.ACTIVE 
      });

    const event = new Event({
      title,
      description,
      startDate: validatedDates.startDate,
      endDate: validatedDates.endDate,
      location,
      maxParticipants: maxParticipants || 100,
      status,
      roles,
      users: users || [],
      currentParticipants: (users || []).length
    });

    await event.save();

    logger.info('Event created', {
      eventId: event._id,
      title: event.title,
      createdBy: req.user.userId,
      startDate: event.startDate,
      endDate: event.endDate
    });

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events - List events with filtering and pagination
router.get('/', auth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || config.pagination.defaultLimit, config.pagination.maxLimit);
    const skip = (page - 1) * limit;

    // Build query filters
    const filters = {};
    
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    if (req.query.search) {
      filters.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { location: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.startDate || req.query.endDate) {
      filters.startDate = {};
      if (req.query.startDate) {
        filters.startDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filters.startDate.$lte = new Date(req.query.endDate);
      }
    }

    // Filter by user participation (if requested)
    if (req.query.myEvents === 'true') {
      filters['users.userId'] = req.user.userId;
    }

    const [events, total] = await Promise.all([
      Event.find(filters)
        .populate('users.userId', 'name email')
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments(filters)
    ]);

    // Update statuses for retrieved events
    const updatedEvents = events.map(event => {
      const currentStatus = determineEventStatus(event);
      if (currentStatus !== event.status) {
        event.status = currentStatus;
        // Note: We're not saving here for performance, but this could be done in background
      }
      return event;
    });

    res.json({
      events: updatedEvents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        status: req.query.status,
        search: req.query.search,
        myEvents: req.query.myEvents === 'true'
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/admin - Get events for admin dashboard (with populated users)
router.get('/admin', auth, requireRole.hasManagementRole, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('users.userId', 'name email');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/events/:id - Update an event (management roles)
router.put('/:id', auth, requireRole.requirePermission(PERMISSIONS.EDIT_EVENTS), async (req, res) => {
  const { title, description, roles } = req.body;
  const { id } = req.params;
  
  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    event.title = title || event.title;
    event.description = description || event.description;
    if (roles) event.roles = roles;
    
    await event.save();
    res.json({ message: 'Event updated', event });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/events/:id - Delete an event (management roles)
router.delete('/:id', auth, requireRole.requirePermission(PERMISSIONS.DELETE_EVENTS), async (req, res) => {
  const { id } = req.params;
  
  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    await Event.findByIdAndDelete(id);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/:eventId/assign-user - Assign a user to an event with a role (admin only)
router.post('/:eventId/assign-user', auth, requireRole.requirePermission(PERMISSIONS.ASSIGN_USERS), async (req, res) => {
  const { userId, role } = req.body;
  const { eventId } = req.params;
  try {
    // Add user to event's users array if not already present
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!event.roles.includes(role)) {
      return res.status(400).json({ message: 'Role not defined for this event' });
    }
    const userExists = event.users.some(u => u.userId.toString() === userId);
    if (!userExists) {
      event.users.push({ userId, role });
    } else {
      // Update role if user already assigned
      event.users = event.users.map(u => u.userId.toString() === userId ? { userId, role } : u);
    }
    await event.save();

    // Add event to user's events array if not already present
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const eventExists = user.events.some(e => e.eventId.toString() === eventId);
    if (!eventExists) {
      user.events.push({ eventId, role });
    } else {
      // Update role if event already assigned
      user.events = user.events.map(e => e.eventId.toString() === eventId ? { eventId, role } : e);
    }
    await user.save();

    res.json({ message: 'User assigned to event with role', event, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/events/:eventId/remove-user - Remove a user from an event (admin only)
router.post('/:eventId/remove-user', auth, requireRole.requirePermission(PERMISSIONS.ASSIGN_USERS), async (req, res) => {
  const { userId } = req.body;
  const { eventId } = req.params;
  try {
    // Remove user from event's users array
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    event.users = event.users.filter(u => u.userId.toString() !== userId);
    await event.save();

    // Remove event from user's events array
    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.events = user.events.filter(e => e.eventId.toString() !== eventId);
    await user.save();

    res.json({ message: 'User removed from event', event, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 