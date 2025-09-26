const express = require('express');
const router = express.Router();
const ArchiveLink = require('../models/ArchiveLink');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const { PERMISSIONS, ROLES } = require('../constants/roles');

// POST /api/archive - Create a new archive link
router.post('/', auth, async (req, res) => {
  const { eventId, title, driveUrl } = req.body;
  if (!eventId || !title || !driveUrl) {
    return res.status(400).json({ message: 'eventId, title, and driveUrl are required' });
  }
  try {
    const link = new ArchiveLink({ eventId, title, driveUrl });
    await link.save();
    res.status(201).json({ message: 'Archive link created', link });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/archive/:eventId - List all archive links for an event
router.get('/:eventId', auth, async (req, res) => {
  try {
    const links = await ArchiveLink.find({ eventId: req.params.eventId });
    res.json(links);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/archive/:id - Update an archive link
router.put('/:id', auth, async (req, res) => {
  const { title, driveUrl } = req.body;
  try {
    const link = await ArchiveLink.findByIdAndUpdate(
      req.params.id,
      { title, driveUrl },
      { new: true }
    );
    if (!link) return res.status(404).json({ message: 'Archive link not found' });
    res.json({ message: 'Archive link updated', link });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/archive/:id - Delete an archive link
router.delete('/:id', auth, async (req, res) => {
  try {
    const link = await ArchiveLink.findByIdAndDelete(req.params.id);
    if (!link) return res.status(404).json({ message: 'Archive link not found' });
    res.json({ message: 'Archive link deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 