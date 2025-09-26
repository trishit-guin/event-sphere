// Event validation and business logic utilities
const { AppError, ValidationError } = require('../middleware/errorHandler');
const config = require('../config/config');

// Validate event dates
const validateEventDates = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check if dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ValidationError('Invalid date format');
  }

  // Start date should be in the future (allow 1 hour buffer for editing)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  if (start < oneHourAgo) {
    throw new ValidationError('Start date cannot be in the past');
  }

  // End date should be after start date
  if (end <= start) {
    throw new ValidationError('End date must be after start date');
  }

  // Event duration shouldn't be too long (max 365 days)
  const maxDuration = 365 * 24 * 60 * 60 * 1000; // 365 days in milliseconds
  if (end.getTime() - start.getTime() > maxDuration) {
    throw new ValidationError('Event duration cannot exceed 365 days');
  }

  // Minimum event duration (15 minutes)
  const minDuration = 15 * 60 * 1000; // 15 minutes
  if (end.getTime() - start.getTime() < minDuration) {
    throw new ValidationError('Event must be at least 15 minutes long');
  }

  return { startDate: start, endDate: end };
};

// Determine event status based on dates and current status
const determineEventStatus = (event) => {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  // If manually cancelled, keep cancelled status
  if (event.status === config.eventStatus.CANCELLED) {
    return config.eventStatus.CANCELLED;
  }

  // If manually completed, keep completed status (unless dates don't make sense)
  if (event.status === config.eventStatus.COMPLETED) {
    // Only allow completed status if event has actually started
    if (now >= start) {
      return config.eventStatus.COMPLETED;
    } else {
      // Reset to appropriate status if completion is premature
      return config.eventStatus.ACTIVE;
    }
  }

  // Auto-determine status based on dates
  if (now < start) {
    return event.status === config.eventStatus.DRAFT ? config.eventStatus.DRAFT : config.eventStatus.ACTIVE;
  } else if (now >= start && now <= end) {
    return config.eventStatus.ACTIVE;
  } else {
    return config.eventStatus.COMPLETED;
  }
};

// Validate status transitions
const validateStatusTransition = (currentStatus, newStatus, event) => {
  const validTransitions = {
    [config.eventStatus.DRAFT]: [config.eventStatus.ACTIVE, config.eventStatus.CANCELLED],
    [config.eventStatus.ACTIVE]: [config.eventStatus.COMPLETED, config.eventStatus.CANCELLED],
    [config.eventStatus.COMPLETED]: [config.eventStatus.ACTIVE], // Allow reactivation if dates permit
    [config.eventStatus.CANCELLED]: [config.eventStatus.DRAFT, config.eventStatus.ACTIVE] // Allow reactivation
  };

  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    throw new ValidationError(`Cannot change status from ${currentStatus} to ${newStatus}`);
  }

  // Additional validation based on dates
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  if (newStatus === config.eventStatus.ACTIVE) {
    // Can't activate if start date is too far in future or already ended
    if (start > new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) { // 7 days in future
      throw new ValidationError('Cannot activate event that starts more than 7 days in the future');
    }
    if (end < now) {
      throw new ValidationError('Cannot activate event that has already ended');
    }
  }

  if (newStatus === config.eventStatus.COMPLETED && now < start) {
    throw new ValidationError('Cannot complete event that has not started yet');
  }

  return true;
};

// Check if user can modify event dates
const canModifyEventDates = (event, user) => {
  const now = new Date();
  const start = new Date(event.startDate);
  
  // If event has started, only admins can modify dates
  if (now >= start && (!user.events || !Array.isArray(user.events) || !user.events.some(e => e.role === 'admin'))) {
    return false;
  }

  // If event starts in less than 24 hours, only management roles can modify
  const twentyFourHours = 24 * 60 * 60 * 1000;
  if (start.getTime() - now.getTime() < twentyFourHours) {
    if (!user.events || !Array.isArray(user.events)) {
      return false;
    }
    const userRole = user.events.find(e => e.eventId.toString() === event._id.toString())?.role;
    return ['admin', 'te_head', 'be_head'].includes(userRole);
  }

  return true;
};

// Automatically update event statuses (for scheduled job)
const updateEventStatuses = async () => {
  const Event = require('../models/Event');
  
  try {
    const events = await Event.find({
      status: { $in: [config.eventStatus.ACTIVE, config.eventStatus.DRAFT] }
    });

    const updates = [];
    
    for (const event of events) {
      const newStatus = determineEventStatus(event);
      if (newStatus !== event.status) {
        updates.push(
          Event.findByIdAndUpdate(event._id, { status: newStatus })
        );
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`Updated status for ${updates.length} events`);
    }
  } catch (error) {
    console.error('Error updating event statuses:', error);
  }
};

// Get events that need status updates
const getEventsNeedingStatusUpdate = async () => {
  const Event = require('../models/Event');
  const now = new Date();
  
  // Find active events that have ended
  const eventsToComplete = await Event.find({
    status: config.eventStatus.ACTIVE,
    endDate: { $lt: now }
  });

  // Find draft/active events that should be active based on dates
  const eventsToActivate = await Event.find({
    status: { $in: [config.eventStatus.DRAFT, config.eventStatus.ACTIVE] },
    startDate: { $lte: now },
    endDate: { $gte: now }
  });

  return { eventsToComplete, eventsToActivate };
};

module.exports = {
  validateEventDates,
  determineEventStatus,
  validateStatusTransition,
  canModifyEventDates,
  updateEventStatuses,
  getEventsNeedingStatusUpdate
};