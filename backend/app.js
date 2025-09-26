require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config/config');
const { errorHandler, AppError } = require('./middleware/errorHandler');
const { conditionalRateLimiter, authLimiter } = require('./middleware/rateLimiter');
const { logger, requestLogger, securityLogger } = require('./utils/logger');
const { validateRequest } = require('./middleware/validation');
const scheduledTasksService = require('./services/scheduledTasks');

// Environment variable validation
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error('Missing required environment variables:', missingVars.join(', '));
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// MongoDB connection
mongoose.connect(config.database.mongoUri, config.database.options)
.then(() => {
  logger.info('MongoDB connected successfully');
  console.log('✅ MongoDB connected');
  
  // Start scheduled tasks after database connection
  setTimeout(() => {
    scheduledTasksService.start();
  }, 2000); // Wait 2 seconds for everything to initialize
})
.catch(err => {
  logger.error('MongoDB connection error:', err);
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morganLogger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const eventsRouter = require('./routes/events');
const archiveRouter = require('./routes/archive');
const tasksRouter = require('./routes/tasks');
const adminRouter = require('./routes/admin');

var app = express();

// Trust proxy for accurate IP addresses behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(requestLogger);
app.use(conditionalRateLimiter);

// CORS configuration
app.use(cors(config.cors));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(morganLogger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/archive', archiveRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.nodeEnv,
    version: '1.0.0'
  });
});

// API not found handler
app.use('/api/*', (req, res, next) => {
  next(new AppError(`API endpoint ${req.originalUrl} not found`, 404));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(new AppError(`Page ${req.originalUrl} not found`, 404));
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  scheduledTasksService.stop();
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  scheduledTasksService.stop();
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app;
