const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const { validatePassword, hashPassword } = require('../utils/password');
const { AppError, ValidationError } = require('../middleware/errorHandler');
const { securityLogger } = require('../utils/logger');
const { validateRequest } = require('../middleware/validation');

// Validation rules for login
const loginValidation = {
  email: { required: true, type: 'email' },
  password: { required: true, minLength: 1 }
};

// POST /api/auth/login
router.post('/login', validateRequest(loginValidation), async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      securityLogger.warn('Login attempt with invalid email', { 
        email, 
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return next(new AppError('Invalid email or password. Please check your credentials and try again.', 401));
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      securityLogger.warn('Login attempt on locked account', { 
        email, 
        ip: req.ip,
        lockUntil: user.lockUntil
      });
      return next(new AppError(`Account temporarily locked due to too many failed login attempts. Please try again in ${minutesLeft} minute(s).`, 423));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment failed login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      if (user.loginAttempts >= config.security.maxLoginAttempts) {
        user.lockUntil = Date.now() + config.security.lockoutDuration;
        securityLogger.warn('Account locked due to too many failed attempts', { 
          email, 
          ip: req.ip,
          attempts: user.loginAttempts
        });
      }
      
      await user.save();
      
      securityLogger.warn('Failed login attempt', { 
        email, 
        ip: req.ip,
        attempts: user.loginAttempts
      });
      
      const remainingAttempts = config.security.maxLoginAttempts - user.loginAttempts;
      if (remainingAttempts > 0) {
        return next(new AppError(`Invalid email or password. You have ${remainingAttempts} attempt(s) remaining before account lockout.`, 401));
      } else {
        return next(new AppError('Invalid email or password. Your account has been temporarily locked due to too many failed attempts.', 401));
      }
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
    }
    user.lastLogin = new Date();
    await user.save();

    const payload = { 
      userId: user._id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000)
    };
    
    const token = jwt.sign(payload, config.jwt.secret, { 
      expiresIn: config.jwt.expiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });

    securityLogger.info('Successful login', { 
      userId: user._id,
      email, 
      ip: req.ip
    });

    // Return user info without sensitive fields (handled by toJSON transform)
    res.json({ 
      message: 'Login successful', 
      token, 
      user: user.toJSON(),
      expiresIn: config.jwt.expiresIn
    });
  } catch (err) {
    next(err);
  }
});

// Note: Public user registration has been disabled for security purposes.
// New users can only be created by administrators through the /api/admin/users endpoint.
// This ensures proper user management and access control.

module.exports = router; 