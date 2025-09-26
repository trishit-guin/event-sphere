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

// GET /api/events/:id - Get event by ID with detailed information
router.get('/:id', auth, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('users.userId', 'name email lastLogin')
      .lean();

    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    // Update and return current status
    event.status = determineEventStatus(event);

    // Add additional computed fields
    event.isUpcoming = new Date(event.startDate) > new Date();
    event.isActive = event.status === config.eventStatus.ACTIVE;
    event.daysUntilStart = Math.ceil((new Date(event.startDate) - new Date()) / (1000 * 60 * 60 * 24));
    event.duration = Math.ceil((new Date(event.endDate) - new Date(event.startDate)) / (1000 * 60 * 60));

    res.json({ event });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/admin/dashboard - Get events for admin dashboard
router.get('/admin/dashboard', auth, requireRole.hasManagementRole, async (req, res, next) => {
  try {
    const events = await Event.find()
      .populate('users.userId', 'name email')
      .sort({ createdAt: -1 });
    
    // Add status statistics
    const statusCounts = events.reduce((acc, event) => {
      const currentStatus = determineEventStatus(event);
      acc[currentStatus] = (acc[currentStatus] || 0) + 1;
      return acc;
    }, {});

    res.json({
      events,
      statistics: {
        total: events.length,
        statusCounts,
        upcomingEvents: events.filter(e => new Date(e.startDate) > new Date()).length,
        activeEvents: events.filter(e => e.status === config.eventStatus.ACTIVE).length
      }
    });
  } catch (err) {
    next(err);
  }
});

// Validation for event updates
const updateEventValidation = {
  title: { minLength: 3, maxLength: 100 },
  description: { minLength: 10, maxLength: 1000 },
  startDate: { type: 'date' },
  endDate: { type: 'date' },
  location: { maxLength: 200 },
  maxParticipants: { type: 'number', min: 1, max: config.limits.maxUsersPerEvent }
};

// PUT /api/events/:id - Update event
router.put('/:id', auth, requireRole.requirePermission(PERMISSIONS.EDIT_EVENTS), validateRequest(updateEventValidation), async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    const updateData = { ...req.body };

    // Handle date updates with validation
    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate ? new Date(updateData.startDate) : event.startDate;
      const endDate = updateData.endDate ? new Date(updateData.endDate) : event.endDate;

      // Check if user can modify dates
      if (!canModifyEventDates(event, req.user)) {
        return next(new AppError('Cannot modify event dates at this time', 403));
      }

      const validatedDates = validateEventDates(startDate, endDate);
      updateData.startDate = validatedDates.startDate;
      updateData.endDate = validatedDates.endDate;

      // Recalculate status based on new dates
      updateData.status = determineEventStatus({
        ...event.toObject(),
        ...updateData
      });
    }

    // Handle status updates
    if (updateData.status && updateData.status !== event.status) {
      validateStatusTransition(event.status, updateData.status, event);
    }

    // Update participant count if users array is modified
    if (updateData.users) {
      updateData.currentParticipants = updateData.users.length;
      
      // Validate participant limit
      if (updateData.currentParticipants > (updateData.maxParticipants || event.maxParticipants)) {
        return next(new ValidationError('Cannot exceed maximum participant limit'));
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('users.userId', 'name email');

    logger.info('Event updated', {
      eventId: updatedEvent._id,
      updatedBy: req.user.userId,
      changes: Object.keys(updateData)
    });

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/events/:id/status - Update event status only
router.patch('/:id/status', auth, requireRole.requirePermission(PERMISSIONS.EDIT_EVENTS), async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!Object.values(config.eventStatus).includes(status)) {
      return next(new ValidationError('Invalid status value'));
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    // Validate status transition
    validateStatusTransition(event.status, status, event);

    event.status = status;
    await event.save();

    logger.info('Event status updated', {
      eventId: event._id,
      oldStatus: event.status,
      newStatus: status,
      updatedBy: req.user.userId
    });

    res.json({
      message: 'Event status updated successfully',
      event: { _id: event._id, status: event.status }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/events/:eventId/users - Add user to event with role
router.post('/:eventId/users', auth, requireRole.requirePermission(PERMISSIONS.MANAGE_EVENT_USERS), async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { userId, role } = req.body;

    if (!userId || !role) {
      return next(new ValidationError('User ID and role are required'));
    }

    if (!Object.values(ROLES).includes(role)) {
      return next(new ValidationError('Invalid role'));
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    // Check participant limit
    if (event.currentParticipants >= event.maxParticipants) {
      return next(new AppError('Event has reached maximum participant limit', 400));
    }

    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if user is already in event
    const existingUserIndex = event.users.findIndex(u => u.userId.toString() === userId);
    const existingEventIndex = user.events.findIndex(e => e.eventId.toString() === eventId);

    if (existingUserIndex !== -1) {
      // Update existing role
      event.users[existingUserIndex].role = role;
      user.events[existingEventIndex].role = role;
    } else {
      // Add new user to event
      event.users.push({ userId, role });
      user.events.push({ eventId, role });
      event.currentParticipants += 1;
    }

    await Promise.all([event.save(), user.save()]);

    logger.info('User added to event', {
      eventId,
      userId,
      role,
      addedBy: req.user.userId
    });

    res.json({
      message: 'User added to event successfully',
      event: await Event.findById(eventId).populate('users.userId', 'name email')
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:eventId/users/:userId - Remove user from event
router.delete('/:eventId/users/:userId', auth, requireRole.requirePermission(PERMISSIONS.MANAGE_EVENT_USERS), async (req, res, next) => {
  try {
    const { eventId, userId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    const User = require('../models/User');
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Remove user from event
    const userIndex = event.users.findIndex(u => u.userId.toString() === userId);
    if (userIndex !== -1) {
      event.users.splice(userIndex, 1);
      event.currentParticipants = Math.max(0, event.currentParticipants - 1);
    }

    // Remove event from user
    const eventIndex = user.events.findIndex(e => e.eventId.toString() === eventId);
    if (eventIndex !== -1) {
      user.events.splice(eventIndex, 1);
    }

    await Promise.all([event.save(), user.save()]);

    logger.info('User removed from event', {
      eventId,
      userId,
      removedBy: req.user.userId
    });

    res.json({
      message: 'User removed from event successfully',
      event: await Event.findById(eventId).populate('users.userId', 'name email')
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id - Delete event (admin only)
router.delete('/:id', auth, requireRole.requirePermission(PERMISSIONS.DELETE_EVENTS), async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    // Prevent deletion of active events unless admin
    if (event.status === config.eventStatus.ACTIVE) {
      const userPermissions = req.user.permissions || [];
      if (!userPermissions.includes(PERMISSIONS.MANAGE_ALL_EVENTS)) {
        return next(new AppError('Cannot delete active events', 403));
      }
    }

    // Remove event from all users
    const User = require('../models/User');
    await User.updateMany(
      { 'events.eventId': event._id },
      { $pull: { events: { eventId: event._id } } }
    );

    // Delete related tasks
    const Task = require('../models/Task');
    await Task.deleteMany({ eventId: event._id });

    // Delete related archive links
    const ArchiveLink = require('../models/ArchiveLink');
    await ArchiveLink.deleteMany({ eventId: event._id });

    // Delete the event
    await Event.findByIdAndDelete(req.params.id);

    logger.info('Event deleted', {
      eventId: event._id,
      title: event.title,
      deletedBy: req.user.userId
    });

    res.json({ message: 'Event and all related data deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/events/:id/status - Update event status
router.patch('/:id/status', auth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const eventId = req.params.id;

    // Validate status
    const validStatuses = Object.values(config.eventStatus);
    if (!status || !validStatuses.includes(status)) {
      return next(new ValidationError('Invalid status provided'));
    }

    const event = await Event.findById(eventId).populate('users.userId', 'name email');
    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    // Check if user has permission to modify this event
    const userRole = event.users.find(u => 
      u.userId._id.toString() === req.user.userId.toString()
    )?.role;

    const canModifyStatus = ['te_head', 'be_head', 'admin'].includes(userRole) || 
                           ['admin'].includes(req.user.role);

    if (!canModifyStatus) {
      return next(new AppError('Insufficient permissions to modify event status', 403));
    }

    // Validate status transition
    const isValidTransition = validateStatusTransition(event.status, status, event);
    if (!isValidTransition.valid) {
      return next(new ValidationError(isValidTransition.reason));
    }

    // Update the status
    const oldStatus = event.status;
    event.status = status;
    await event.save();

    logger.info('Event status updated', {
      eventId: event._id,
      title: event.title,
      oldStatus,
      newStatus: status,
      updatedBy: req.user.userId,
      userRole
    });

    res.json({
      message: 'Event status updated successfully',
      event: {
        _id: event._id,
        title: event.title,
        status: event.status,
        oldStatus
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;