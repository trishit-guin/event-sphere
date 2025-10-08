const mongoose = require('mongoose');
const { ROLES } = require('../constants/roles');

const eventUserSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { 
    type: String, 
    enum: Object.values(ROLES), 
    required: true 
  }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'active', 'completed', 'cancelled'], 
    default: 'draft' 
  },
  location: { type: String },
  maxParticipants: { type: Number, default: 100 },
  currentParticipants: { type: Number, default: 0 },
  roles: [{ type: String, required: true }],
  users: [eventUserSchema]
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field to calculate current participants from users array
eventSchema.virtual('actualParticipants').get(function() {
  return this.users ? this.users.length : 0;
});

module.exports = mongoose.model('Event', eventSchema); 