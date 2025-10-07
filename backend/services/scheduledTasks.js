// Scheduled tasks service for EventSphere
const cron = require('node-cron');
const { logger } = require('../utils/logger');
const { updateEventStatuses, getEventsNeedingStatusUpdate } = require('../utils/eventUtils');

class ScheduledTasksService {
  constructor() {
    this.tasks = new Map();
    this.isRunning = false;
  }

  // Initialize and start all scheduled tasks
  start() {
    if (this.isRunning) {
      logger.warn('Scheduled tasks already running');
      return;
    }

    this.isRunning = true;
    // logger.info('Starting scheduled tasks service'); // Commented for cleaner logs

    // Update event statuses every 5 minutes
    this.scheduleTask('updateEventStatuses', '*/5 * * * *', async () => {
      try {
        await updateEventStatuses();
        logger.debug('Event statuses updated successfully');
      } catch (error) {
        logger.error('Failed to update event statuses:', error);
      }
    });

    // Generate daily reports at midnight
    this.scheduleTask('dailyReport', '0 0 * * *', async () => {
      try {
        await this.generateDailyReport();
        logger.info('Daily report generated successfully');
      } catch (error) {
        logger.error('Failed to generate daily report:', error);
      }
    });

    // Clean up old logs weekly (every Sunday at 2 AM)
    this.scheduleTask('cleanupLogs', '0 2 * * 0', async () => {
      try {
        await this.cleanupOldLogs();
        logger.info('Log cleanup completed successfully');
      } catch (error) {
        logger.error('Failed to cleanup old logs:', error);
      }
    });

    // Update user last activity daily at 3 AM
    this.scheduleTask('updateUserActivity', '0 3 * * *', async () => {
      try {
        await this.updateUserActivity();
        logger.info('User activity updated successfully');
      } catch (error) {
        logger.error('Failed to update user activity:', error);
      }
    });

    logger.info(`Scheduled ${this.tasks.size} tasks successfully`);
  }

  // Schedule a new task
  scheduleTask(name, cronPattern, taskFunction) {
    if (this.tasks.has(name)) {
      logger.warn(`Task ${name} already exists, skipping`);
      return;
    }

    const task = cron.schedule(cronPattern, taskFunction, {
      scheduled: false,
      timezone: 'UTC'
    });

    this.tasks.set(name, task);
    task.start();

    logger.info(`Scheduled task: ${name} with pattern: ${cronPattern}`);
  }

  // Stop all scheduled tasks
  stop() {
    if (!this.isRunning) {
      logger.warn('Scheduled tasks not running');
      return;
    }

    logger.info('Stopping scheduled tasks service');

    for (const [name, task] of this.tasks) {
      task.stop();
      logger.debug(`Stopped task: ${name}`);
    }

    this.tasks.clear();
    this.isRunning = false;
    logger.info('All scheduled tasks stopped');
  }

  // Generate daily report
  async generateDailyReport() {
    const Event = require('../models/Event');
    const User = require('../models/User');
    const Task = require('../models/Task');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get statistics for today
    const [
      eventsCreatedToday,
      usersCreatedToday,
      tasksCompletedToday,
      activeEvents,
      upcomingEvents
    ] = await Promise.all([
      Event.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      User.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Task.countDocuments({ 
        status: 'done',
        updatedAt: { $gte: today, $lt: tomorrow }
      }),
      Event.countDocuments({ status: 'active' }),
      Event.countDocuments({ 
        status: { $in: ['draft', 'active'] },
        startDate: { $gt: new Date() }
      })
    ]);

    const report = {
      date: today.toISOString().split('T')[0],
      statistics: {
        eventsCreatedToday,
        usersCreatedToday,
        tasksCompletedToday,
        activeEvents,
        upcomingEvents
      },
      timestamp: new Date().toISOString()
    };

    logger.info('Daily report generated', report);
    
    // Here you could save to database or send email notifications
    // For now, we just log it
  }

  // Clean up old log files
  async cleanupOldLogs() {
    const fs = require('fs').promises;
    const path = require('path');
    
    const logsDir = path.join(__dirname, '../logs');
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    try {
      const files = await fs.readdir(logsDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(logsDir, file);
        const stats = await fs.stat(filePath);

        if (Date.now() - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      logger.info(`Cleaned up ${deletedCount} old log files`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      // Logs directory doesn't exist, which is fine
    }
  }

  // Update user last activity
  async updateUserActivity() {
    const User = require('../models/User');
    
    // Mark users as inactive if they haven't logged in for 90 days
    const inactivityThreshold = new Date();
    inactivityThreshold.setDate(inactivityThreshold.getDate() - 90);

    const result = await User.updateMany(
      { 
        lastLogin: { $lt: inactivityThreshold },
        isActive: true
      },
      { 
        isActive: false 
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`Marked ${result.modifiedCount} users as inactive due to inactivity`);
    }

    // You could also implement other user activity updates here
  }

  // Get status of all tasks
  getTaskStatus() {
    const status = {};
    for (const [name, task] of this.tasks) {
      status[name] = {
        running: task.running,
        destroyed: task.destroyed
      };
    }
    return {
      isServiceRunning: this.isRunning,
      totalTasks: this.tasks.size,
      tasks: status
    };
  }

  // Manually run a specific task
  async runTask(taskName) {
    const taskFunctions = {
      updateEventStatuses: updateEventStatuses,
      dailyReport: () => this.generateDailyReport(),
      cleanupLogs: () => this.cleanupOldLogs(),
      updateUserActivity: () => this.updateUserActivity()
    };

    const taskFunction = taskFunctions[taskName];
    if (!taskFunction) {
      throw new Error(`Task ${taskName} not found`);
    }

    logger.info(`Manually running task: ${taskName}`);
    await taskFunction();
    logger.info(`Task ${taskName} completed`);
  }
}

// Create singleton instance
const scheduledTasksService = new ScheduledTasksService();

// Graceful shutdown handling
process.on('SIGINT', () => {
  logger.info('Received SIGINT, stopping scheduled tasks');
  scheduledTasksService.stop();
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, stopping scheduled tasks');
  scheduledTasksService.stop();
});

module.exports = scheduledTasksService;