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
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      securityLogger.warn('Login attempt on locked account', { 
        email, 
        ip: req.ip,
        lockUntil: user.lockUntil
      });
      return next(new AppError('Account temporarily locked. Please try again later.', 423));
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
      
      return next(new AppError('Invalid credentials', 401));
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