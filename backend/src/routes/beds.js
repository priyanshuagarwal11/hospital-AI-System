// ============================================================
// routes/beds.js - Bed Management REST API
// GET    /api/beds         - List all beds (with filters)
// POST   /api/beds         - Create a new bed
// GET    /api/beds/:id     - Get single bed
// PUT    /api/beds/:id     - Update bed
// DELETE /api/beds/:id     - Delete bed
// GET    /api/beds/stats   - Bed statistics summary
// ============================================================

const express = require('express');
const Bed     = require('../models/Bed');
const Alert   = require('../models/Alert');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All bed routes require authentication
router.use(protect);

// ── GET /api/beds/stats ────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const total     = await Bed.countDocuments();
    const available = await Bed.countDocuments({ status: 'available' });
    const occupied  = await Bed.countDocuments({ status: 'occupied' });
    const maintenance = await Bed.countDocuments({ status: 'maintenance' });
    const reserved  = await Bed.countDocuments({ status: 'reserved' });

    // By department breakdown
    const byDepartment = await Bed.aggregate([
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
          occupied:  { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        total, available, occupied, maintenance, reserved,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0,
        byDepartment
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/beds ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { department, status, type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (status)     filter.status     = status;
    if (type)       filter.type       = type;

    const skip  = (page - 1) * limit;
    const total = await Bed.countDocuments(filter);
    const beds  = await Bed.find(filter)
      .populate('patient', 'name patientId diagnosis severity')
      .sort({ department: 1, bedNumber: 1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count: beds.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: beds
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/beds ─────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const bed = await Bed.create(req.body);
    res.status(201).json({ success: true, message: 'Bed created successfully', data: bed });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Bed number already exists' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── GET /api/beds/:id ──────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id).populate('patient');
    if (!bed) return res.status(404).json({ success: false, message: 'Bed not found' });
    res.json({ success: true, data: bed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/beds/:id ──────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const bed = await Bed.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('patient');

    if (!bed) return res.status(404).json({ success: false, message: 'Bed not found' });

    // Auto-generate alert if bed is becoming unavailable in a critical department
    const criticalDepts = ['ICU', 'Emergency'];
    if (criticalDepts.includes(bed.department)) {
      const available = await Bed.countDocuments({ department: bed.department, status: 'available' });
      if (available <= 2) {
        await Alert.create({
          type: 'bed_shortage',
          severity: 'critical',
          title: `Critical Bed Shortage – ${bed.department}`,
          message: `Only ${available} bed(s) available in ${bed.department}. Immediate action required.`,
          department: bed.department
        });
      }
    }

    res.json({ success: true, message: 'Bed updated successfully', data: bed });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/beds/:id ───────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id);
    if (!bed) return res.status(404).json({ success: false, message: 'Bed not found' });

    if (bed.status === 'occupied') {
      return res.status(400).json({ success: false, message: 'Cannot delete an occupied bed' });
    }

    await bed.deleteOne();
    res.json({ success: true, message: 'Bed deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
