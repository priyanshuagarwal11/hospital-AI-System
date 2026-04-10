// ============================================================
// routes/alerts.js
// ============================================================
const express = require('express');
const Alert   = require('../models/Alert');
const { protect } = require('../middleware/auth');
const router  = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { isRead, isResolved, severity, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (isRead !== undefined)    filter.isRead    = isRead === 'true';
    if (isResolved !== undefined) filter.isResolved = isResolved === 'true';
    if (severity)                filter.severity  = severity;

    const skip  = (page - 1) * limit;
    const total = await Alert.countDocuments(filter);
    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip).limit(Number(limit));

    res.json({ success: true, count: alerts.length, total, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const alert = await Alert.create(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, {
      isResolved: true, isRead: true, resolvedAt: new Date(), resolvedBy: req.user._id
    }, { new: true });
    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/mark-all-read', async (req, res) => {
  try {
    await Alert.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
