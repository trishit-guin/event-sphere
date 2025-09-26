const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

module.exports = async function (req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  if (!config.jwt.secret) {
    return res.status(500).json({ message: 'JWT_SECRET not configured' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });
    
    req.user = await User.findById(decoded.userId).select('-password').populate('events.eventId');
    
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Ensure events array exists and is properly formatted
    if (!req.user.events) {
      req.user.events = [];
    }
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 