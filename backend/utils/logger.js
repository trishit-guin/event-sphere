const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'event-sphere-backend' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Write all logs to console in development
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ] : [])
  ]
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  // Log response when request completes
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });
    
    originalSend.call(this, data);
  };
  
  next();
};

// Security event logging
const securityLogger = {
  info: (message, metadata = {}) => {
    logger.info(message, { ...metadata, event: 'security', severity: 'low' });
  },
  
  warn: (message, metadata = {}) => {
    logger.warn(message, { ...metadata, event: 'security', severity: 'medium' });
  },
  
  error: (message, metadata = {}) => {
    logger.error(message, { ...metadata, event: 'security', severity: 'high' });
  },
  
  loginAttempt: (email, ip, success) => {
    logger.info('Login attempt', {
      email,
      ip,
      success,
      event: 'authentication',
      severity: success ? 'low' : 'medium'
    });
  },
  
  unauthorized: (userId, action, resource) => {
    logger.warn('Unauthorized access attempt', {
      userId,
      action,
      resource,
      event: 'authorization',
      severity: 'high'
    });
  },
  
  dataAccess: (userId, resource, action) => {
    logger.info('Data access', {
      userId,
      resource,
      action,
      event: 'data_access',
      severity: 'low'
    });
  }
};

module.exports = {
  logger,
  requestLogger,
  securityLogger
};