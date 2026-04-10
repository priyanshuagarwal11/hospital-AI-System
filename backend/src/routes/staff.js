// ============================================================
// routes/staff.js - Staff Management REST API
// ============================================================

const express = require('express');
const Staff   = require('../models/Staff');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/staff/stats
router.get('/stats', async (req, res) => {
  try {
    const total     = await Staff.countDocuments({ isActive: true });
    const onDuty    = await Staff.countDocuments({ status: 'on-duty', isActive: true });
    const offDuty   = await Staff.countDocuments({ status: 'off-duty', isActive: true });
    const onLeave   = await Staff.countDocuments({ status: 'on-leave', isActive: true });

    const byRole = await Staff.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const byDepartment = await Staff.aggregate([
      { $match: { isActive: true } },
      { $group: {
        _id: '$department',
        total: { $sum: 1 },
        onDuty: { $sum: { $cond: [{ $eq: ['$status', 'on-duty'] }, 1, 0] } }
      }},
      { $sort: { _id: 1 } }
    ]);

    const byShift = await Staff.aggregate([
      { $match: { isActive: true, status: 'on-duty' } },
      { $group: { _id: '$shift', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: { total, onDuty, offDuty, onLeave, availabilityRate: total > 0 ? Math.round((onDuty / total) * 100) : 0, byRole, byDepartment, byShift }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/staff
router.get('/', async (req, res) => {
  try {
    const { department, role, status, shift, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (department) filter.department = department;
    if (role)       filter.role       = role;
    if (status)     filter.status     = status;
    if (shift)      filter.shift      = shift;

    const skip  = (page - 1) * limit;
    const total = await Staff.countDocuments(filter);
    const staff = await Staff.find(filter)
      .sort({ department: 1, name: 1 })
      .skip(skip).limit(Number(limit));

    res.json({ success: true, count: staff.length, total, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/staff
router.post('/', async (req, res) => {
  try {
    const staff = await Staff.create(req.body);
    res.status(201).json({ success: true, message: 'Staff member added', data: staff });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/staff/:id
router.get('/:id', async (req, res) => {
  try {
    const s = await Staff.findById(req.params.id);
    if (!s) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: s });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/staff/:id
router.put('/:id', async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!staff) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/staff/:id
router.delete('/:id', async (req, res) => {
  try {
    await Staff.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Staff member deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
