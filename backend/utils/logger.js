const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Sensitive field names to sanitize (case-insensitive matching)
const SENSITIVE_FIELDS = [
  'password',
  'confirmPassword',
  'oldPassword',
  'newPassword',
  'currentPassword',
  'token',
  'accessToken',
  'refreshToken',
  'authToken',
  'apiKey',
  'api_key',
  'secret',
  'secretKey',
  'privateKey',
  'jwt',
  'authorization',
  'cookie',
  'session'
];

/**
 * Sanitize an object by removing or masking sensitive fields
 * @param {Object} obj - Object to sanitize
 * @param {string} mask - Replacement text for sensitive values
 * @returns {Object} Sanitized copy of the object
 */
const sanitizeObject = (obj, mask = '[HIDDEN]') => {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, mask));
  }
  
  // Handle objects
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    // Check if key matches any sensitive field (case-insensitive)
    const keyLower = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some(field => 
      keyLower.includes(field.toLowerCase())
    );
    
    if (isSensitive) {
      sanitized[key] = mask;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(sanitized[key], mask);
    }
  }
  
  return sanitized;
};

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
    
    // Minimal console output in development
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.printf(({ level, message }) => {
          // Only show errors and important messages, not info logs
          if (level === 'error') {
            return `ERROR: ${message}`;
          }
          return null; // Don't show info logs to console
        })
      })
    ] : [])
  ]
});

// Simple request logging middleware
const requestLogger = (req, res, next) => {
  // Log response when request completes
  const originalSend = res.send;
  res.send = function(data) {
    // Extract request data (body/query params) - FILTER OUT SENSITIVE DATA
    // Note: We intentionally do NOT log headers (which contain Authorization tokens)
    let requestData = '-';
    
    if (req.method === 'GET' && Object.keys(req.query).length > 0) {
      const sanitizedQuery = sanitizeObject(req.query);
      requestData = JSON.stringify(sanitizedQuery);
    } else if (req.method !== 'GET' && Object.keys(req.body).length > 0) {
      // Sanitize request body to remove all sensitive fields
      const sanitizedBody = sanitizeObject(req.body);
      requestData = JSON.stringify(sanitizedBody);
    }
    
    // Clean log format: HIT: 'path' 'data' 'response code'
    console.log(`HIT: Path:'${req.path}' Data:'${requestData}' Status Code:'${res.statusCode}'`);
    
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
  securityLogger,
  sanitizeObject
};