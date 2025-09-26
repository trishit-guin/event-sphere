const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  title: { type: String, required: true },
  description: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['todo', 'in_progress', 'done', 'cancelled'], 
    default: 'todo' 
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  deadline: { type: Date },
  completedAt: { type: Date },
  estimatedHours: { type: Number },
  actualHours: { type: Number },
  viewLevel: [{ type: String }],
  tags: [{ type: String }],
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  }]
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Task', taskSchema); 