// MongoDB Transaction Utilities
// Provides helper functions for atomic operations across multiple collections
const mongoose = require('mongoose');
const { logger } = require('./logger');

/**
 * Execute operations within a MongoDB transaction
 * Ensures all operations succeed or all fail together (atomicity)
 * 
 * @param {Function} operations - Async function that receives session and performs operations
 * @param {Object} options - Transaction options (optional)
 * @returns {Promise<any>} Result from operations function
 */
async function withTransaction(operations, options = {}) {
  // Check if MongoDB is in replica set mode (required for transactions)
  const isReplicaSet = mongoose.connection.db?.topology?.s?.description?.type === 'ReplicaSetWithPrimary' ||
                       mongoose.connection.db?.topology?.s?.description?.type === 'ReplicaSetNoPrimary';
  
  if (!isReplicaSet) {
    // If not in replica set mode, execute without transaction
    // This allows development without replica set setup
    logger.warn('MongoDB transactions not available (requires replica set). Executing without transaction.');
    return await operations(null);
  }

  const session = await mongoose.startSession();
  
  try {
    // Start transaction with default options
    session.startTransaction({
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' },
      ...options
    });

    // Execute the operations with the session
    const result = await operations(session);

    // Commit the transaction
    await session.commitTransaction();
    
    logger.info('Transaction committed successfully');
    return result;
    
  } catch (error) {
    // Abort transaction on error
    if (session.inTransaction()) {
      await session.abortTransaction();
      logger.error('Transaction aborted due to error:', error);
    }
    throw error;
    
  } finally {
    // End the session
    session.endSession();
  }
}

/**
 * Delete an event and all related data atomically
 * Prevents orphaned tasks, archive links, and user associations
 * 
 * @param {String} eventId - ID of event to delete
 * @param {Object} deletedBy - User performing deletion (for logging)
 * @returns {Promise<Object>} Deletion statistics
 */
async function deleteEventWithRelatedData(eventId, deletedBy) {
  const Event = require('../models/Event');
  const Task = require('../models/Task');
  const ArchiveLink = require('../models/ArchiveLink');
  const User = require('../models/User');

  return await withTransaction(async (session) => {
    const sessionOption = session ? { session } : {};

    // Fetch event to ensure it exists
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      throw new Error('Event not found');
    }

    // Count related data before deletion (for statistics)
    const [tasksCount, archiveLinksCount, usersCount] = await Promise.all([
      Task.countDocuments({ eventId }, sessionOption),
      ArchiveLink.countDocuments({ eventId }, sessionOption),
      User.countDocuments({ 'events.eventId': eventId }, sessionOption)
    ]);

    // Delete all related data in parallel
    await Promise.all([
      // Remove event from all users
      User.updateMany(
        { 'events.eventId': eventId },
        { $pull: { events: { eventId } } },
        sessionOption
      ),
      // Delete related tasks
      Task.deleteMany({ eventId }, sessionOption),
      // Delete related archive links
      ArchiveLink.deleteMany({ eventId }, sessionOption)
    ]);

    // Delete the event itself
    await Event.findByIdAndDelete(eventId, sessionOption);

    logger.info('Event and related data deleted', {
      eventId,
      title: event.title,
      deletedBy: deletedBy?.userId || deletedBy,
      statistics: {
        tasks: tasksCount,
        archiveLinks: archiveLinksCount,
        affectedUsers: usersCount
      }
    });

    return {
      message: 'Event and all related data deleted successfully',
      statistics: {
        tasksDeleted: tasksCount,
        archiveLinksDeleted: archiveLinksCount,
        usersUpdated: usersCount
      }
    };
  });
}

/**
 * Delete a user and cleanup all related data atomically
 * Prevents orphaned tasks and event associations
 * 
 * @param {String} userId - ID of user to delete
 * @param {Object} deletedBy - User performing deletion (for logging)
 * @returns {Promise<Object>} Deletion statistics
 */
async function deleteUserWithRelatedData(userId, deletedBy) {
  const User = require('../models/User');
  const Task = require('../models/Task');
  const Event = require('../models/Event');

  return await withTransaction(async (session) => {
    const sessionOption = session ? { session } : {};

    // Fetch user to ensure they exist
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    // Count related data
    const [tasksCount, eventsCount] = await Promise.all([
      Task.countDocuments({ assignedTo: userId }, sessionOption),
      Event.countDocuments({ 'users.userId': userId }, sessionOption)
    ]);

    // Cleanup related data
    await Promise.all([
      // Unassign all tasks (set to null instead of delete to preserve task history)
      Task.updateMany(
        { assignedTo: userId },
        { $unset: { assignedTo: '' } },
        sessionOption
      ),
      // Remove user from all events
      Event.updateMany(
        { 'users.userId': userId },
        { $pull: { users: { userId } } },
        sessionOption
      )
    ]);

    // Delete the user
    await User.findByIdAndDelete(userId, sessionOption);

    logger.info('User and related data cleaned up', {
      userId,
      email: user.email,
      deletedBy: deletedBy?.userId || deletedBy,
      statistics: {
        tasksUnassigned: tasksCount,
        eventsUpdated: eventsCount
      }
    });

    return {
      message: 'User deleted and related data cleaned up successfully',
      statistics: {
        tasksUnassigned: tasksCount,
        eventsUpdated: eventsCount
      }
    };
  });
}

module.exports = {
  withTransaction,
  deleteEventWithRelatedData,
  deleteUserWithRelatedData
};
