const mongoose = require('mongoose');

const archiveLinkSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  title: { type: String, required: true },
  driveUrl: { type: String, required: true },
  description: { type: String },
  fileType: { 
    type: String, 
    enum: ['document', 'spreadsheet', 'presentation', 'image', 'video', 'audio', 'other'],
    default: 'other'
  },
  size: { type: Number }, // Size in bytes
  isPublic: { type: Boolean, default: false },
  accessLevel: {
    type: String,
    enum: ['public', 'event_members', 'management', 'admin'],
    default: 'event_members'
  },
  downloadCount: { type: Number, default: 0 },
  lastAccessedAt: { type: Date }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('ArchiveLink', archiveLinkSchema); 