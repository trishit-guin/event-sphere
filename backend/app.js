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
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// MongoDB connection
mongoose.connect(config.database.mongoUri, config.database.options)
.then(() => {
  console.log('✅ MongoDB connected');
  
  // Start scheduled tasks after database connection
  setTimeout(() => {
    scheduledTasksService.start();
  }, 2000); // Wait 2 seconds for everything to initialize
})
.catch(err => {
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
const allowedOrigins = ['https://event-sphere-omega.vercel.app','http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001','https://event-sphere-omega.vercel.app/'];

const corsOptions = {
  origin: function (origin, callback) {
    // Check if the incoming origin is in our whitelist
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      // Allow the request
      callback(null, true);
    } else {
      // Block the request
      callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(cors(corsOptions));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(morganLogger('dev')); // Disabled for cleaner logs
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
  console.log('🛑 Shutting down gracefully');
  scheduledTasksService.stop();
  mongoose.connection.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully');
  scheduledTasksService.stop();
  mongoose.connection.close(() => {
    process.exit(0);
  });
});

module.exports = app;
