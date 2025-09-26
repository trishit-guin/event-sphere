const mongoose = require('mongoose');
const { ROLES } = require('../constants/roles');

const userEventSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  role: { 
    type: String, 
    enum: Object.values(ROLES), 
    required: true 
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  events: [userEventSchema],
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

module.exports = mongoose.model('User', userSchema); 