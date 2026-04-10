// ============================================================
// routes/equipment.js - Equipment Management REST API
// ============================================================

const express   = require('express');
const Equipment = require('../models/Equipment');
const Alert     = require('../models/Alert');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/equipment/stats
router.get('/stats', async (req, res) => {
  try {
    const all = await Equipment.find();
    const total = all.reduce((sum, e) => sum + e.quantity, 0);
    const inUse = all.reduce((sum, e) => sum + e.inUse, 0);

    const byCategory = await Equipment.aggregate([
      { $group: {
        _id: '$category',
        total: { $sum: '$quantity' },
        inUse: { $sum: '$inUse' }
      }},
      { $sort: { _id: 1 }}
    ]);

    const byDepartment = await Equipment.aggregate([
      { $group: {
        _id: '$department',
        total: { $sum: '$quantity' },
        inUse: { $sum: '$inUse' }
      }},
      { $sort: { _id: 1 }}
    ]);

    res.json({
      success: true,
      data: {
        totalUnits: total,
        inUse,
        available: total - inUse,
        utilizationRate: total > 0 ? Math.round((inUse / total) * 100) : 0,
        byCategory,
        byDepartment
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/equipment
router.get('/', async (req, res) => {
  try {
    const { department, status, category, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (status)     filter.status     = status;
    if (category)   filter.category   = category;

    const skip  = (page - 1) * limit;
    const total = await Equipment.countDocuments(filter);
    const equipment = await Equipment.find(filter)
      .sort({ department: 1, name: 1 })
      .skip(skip).limit(Number(limit));

    res.json({ success: true, count: equipment.length, total, data: equipment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/equipment
router.post('/', async (req, res) => {
  try {
    const equipment = await Equipment.create(req.body);
    res.status(201).json({ success: true, message: 'Equipment added', data: equipment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/equipment/:id
router.put('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });

    // Alert if utilization > 90%
    if (equipment.quantity > 0 && (equipment.inUse / equipment.quantity) >= 0.9) {
      await Alert.create({
        type: 'equipment_shortage',
        severity: 'high',
        title: `High Equipment Utilization – ${equipment.name}`,
        message: `${equipment.name} in ${equipment.department} is at ${Math.round((equipment.inUse/equipment.quantity)*100)}% utilization.`,
        department: equipment.department
      });
    }

    res.json({ success: true, data: equipment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/equipment/:id
router.delete('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!equipment) return res.status(404).json({ success: false, message: 'Equipment not found' });
    res.json({ success: true, message: 'Equipment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const e = await Equipment.findById(req.params.id);
    if (!e) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: e });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
