const rateLimit = require('express-rate-limit');

// Create different rate limiters for different endpoints
// Using memory store for now to avoid MongoDB dependency issues
const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      message: options.message || 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for whitelisted IPs if needed
    skip: (req) => {
      const whitelistedIPs = process.env.WHITELISTED_IPS ? 
        process.env.WHITELISTED_IPS.split(',') : [];
      return whitelistedIPs.includes(req.ip);
    }
  });
};

// General API rate limit - very permissive for testing
const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // 5000 requests per window per IP (very generous for testing)
  message: 'Too many API requests, please try again in 15 minutes'
});

// Create a middleware that skips rate limiting for certain routes
const conditionalRateLimiter = (req, res, next) => {
  // Skip rate limiting for token validation endpoints
  if (req.path === '/api/users/me' || req.path === '/api/health') {
    return next();
  }
  
  // Apply general rate limiter for other routes
  return generalLimiter(req, res, next);
};

// Permissive rate limit for authentication during testing
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 login attempts per window per IP (very generous for testing)
  message: 'Too many login attempts, please try again in 15 minutes'
});

// Rate limit for user creation (admin operations)
const userCreationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 user creations per hour per IP
  message: 'Too many user creation requests, please try again in 1 hour'
});

// Rate limit for password reset requests
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour per IP
  message: 'Too many password reset requests, please try again in 1 hour'
});

module.exports = {
  generalLimiter,
  conditionalRateLimiter,
  authLimiter,
  userCreationLimiter,
  passwordResetLimiter
};