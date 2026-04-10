// ============================================================
// routes/predictions.js - AI Prediction Proxy + Recommendations
// Calls Python FastAPI AI microservice
// ============================================================

const express = require('express');
const axios   = require('axios');
const Bed     = require('../models/Bed');
const Staff   = require('../models/Staff');
const Equipment = require('../models/Equipment');
const Patient   = require('../models/Patient');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// ── Helper: Get historical data for AI model ──────────────
async function getHistoricalData() {
  const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const admissions = await Patient.aggregate([
    { $match: { admissionDate: { $gte: twoMonthsAgo } } },
    { $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$admissionDate' } },
      count: { $sum: 1 }
    }},
    { $sort: { _id: 1 } }
  ]);

  return admissions.map(d => ({ date: d._id, admissions: d.count }));
}

// ── GET /api/predictions/beds ──────────────────────────────
router.get('/beds', async (req, res) => {
  try {
    const historicalData = await getHistoricalData();

    const aiResponse = await axios.post(`${AI_URL}/predict/beds`, {
      historical_data: historicalData,
      days_ahead: Number(req.query.days) || 7
    }, { timeout: 30000 });

    const currentStats = {
      total:     await Bed.countDocuments(),
      available: await Bed.countDocuments({ status: 'available' }),
      occupied:  await Bed.countDocuments({ status: 'occupied' })
    };

    res.json({
      success: true,
      data: {
        current: currentStats,
        predictions: aiResponse.data,
        historicalData
      }
    });
  } catch (err) {
    // Fallback mock predictions if AI service unavailable
    console.warn('AI service unavailable, using mock predictions');
    const mock = generateMockPrediction('beds');
    res.json({ success: true, data: mock, aiServiceDown: true });
  }
});

// ── GET /api/predictions/equipment ────────────────────────
router.get('/equipment', async (req, res) => {
  try {
    const equipment = await Equipment.find().select('name inUse quantity department');
    const aiResponse = await axios.post(`${AI_URL}/predict/equipment`, {
      equipment_data: equipment.map(e => ({
        name: e.name,
        department: e.department,
        current_usage: e.inUse,
        total: e.quantity,
        utilization_rate: e.quantity > 0 ? (e.inUse / e.quantity) : 0
      })),
      days_ahead: Number(req.query.days) || 1
    }, { timeout: 30000 });

    res.json({ success: true, data: aiResponse.data });
  } catch (err) {
    const mock = generateMockPrediction('equipment');
    res.json({ success: true, data: mock, aiServiceDown: true });
  }
});

// ── GET /api/predictions/staff ─────────────────────────────
router.get('/staff', async (req, res) => {
  try {
    const patientData = await getHistoricalData();
    const staffData   = await Staff.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: { department: '$department', shift: '$shift' }, count: { $sum: 1 } } }
    ]);

    const aiResponse = await axios.post(`${AI_URL}/predict/staff`, {
      patient_data: patientData,
      staff_data: staffData
    }, { timeout: 30000 });

    res.json({ success: true, data: aiResponse.data });
  } catch (err) {
    const mock = generateMockPrediction('staff');
    res.json({ success: true, data: mock, aiServiceDown: true });
  }
});

// ── GET /api/predictions/recommendations ──────────────────
router.get('/recommendations', async (req, res) => {
  try {
    const [bedStats, staffStats, equipStats, patientCount] = await Promise.all([
      Bed.aggregate([{ $group: { _id: '$department', total: { $sum: 1 }, occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } } } }]),
      Staff.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$department', onDuty: { $sum: { $cond: [{ $eq: ['$status', 'on-duty'] }, 1, 0] } }, total: { $sum: 1 } } }]),
      Equipment.aggregate([{ $group: { _id: '$department', inUse: { $sum: '$inUse' }, total: { $sum: '$quantity' } } }]),
      Patient.countDocuments({ status: 'admitted' })
    ]);

    const recommendations = [];

    // Bed recommendations
    bedStats.forEach(dept => {
      const rate = dept.total > 0 ? (dept.occupied / dept.total) : 0;
      if (rate > 0.85) {
        recommendations.push({
          type: 'bed', priority: rate > 0.95 ? 'critical' : 'high',
          department: dept._id,
          title: `High Bed Occupancy in ${dept._id}`,
          message: `${dept._id} is at ${Math.round(rate * 100)}% capacity. Consider allocating more beds or transferring patients.`,
          action: 'Increase Bed Count',
          metric: `${dept.occupied}/${dept.total} beds occupied`
        });
      }
    });

    // Staff recommendations
    staffStats.forEach(dept => {
      const rate = dept.total > 0 ? (dept.onDuty / dept.total) : 0;
      if (rate < 0.5) {
        recommendations.push({
          type: 'staff', priority: rate < 0.3 ? 'critical' : 'medium',
          department: dept._id,
          title: `Staff Shortage in ${dept._id}`,
          message: `Only ${dept.onDuty} of ${dept.total} staff on duty in ${dept._id}. Consider calling in reserve staff.`,
          action: 'Allocate More Staff',
          metric: `${dept.onDuty}/${dept.total} on duty`
        });
      }
    });

    // Equipment recommendations
    equipStats.forEach(dept => {
      const rate = dept.total > 0 ? (dept.inUse / dept.total) : 0;
      if (rate > 0.85) {
        recommendations.push({
          type: 'equipment', priority: 'high',
          department: dept._id,
          title: `Equipment Overutilization in ${dept._id}`,
          message: `Equipment in ${dept._id} is at ${Math.round(rate * 100)}% utilization. Redistribute or procure additional units.`,
          action: 'Redistribute Equipment',
          metric: `${dept.inUse}/${dept.total} units in use`
        });
      }
    });

    recommendations.sort((a, b) => {
      const p = { critical: 0, high: 1, medium: 2, low: 3 };
      return (p[a.priority] || 3) - (p[b.priority] || 3);
    });

    res.json({ success: true, count: recommendations.length, data: recommendations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Mock fallback predictions ──────────────────────────────
function generateMockPrediction(type) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (type === 'beds') {
    return {
      current: { total: 200, available: 45, occupied: 155 },
      predictions: {
        forecast: days.map((d, i) => ({
          day: d, predicted_demand: 155 + Math.round(Math.sin(i) * 10 + Math.random() * 5),
          lower_bound: 145 + i * 2, upper_bound: 175 + i * 2
        })),
        confidence: 0.87, model: 'Random Forest (fallback mock)'
      }
    };
  }
  if (type === 'equipment') {
    return {
      predictions: [
        { name: 'Ventilators', current_usage: 8, predicted_usage: 10, risk: 'high' },
        { name: 'ECG Monitors', current_usage: 15, predicted_usage: 18, risk: 'medium' },
        { name: 'Infusion Pumps', current_usage: 22, predicted_usage: 25, risk: 'low' }
      ],
      model: 'Linear Regression (fallback mock)'
    };
  }
  return {
    predictions: days.map(d => ({
      day: d, required_doctors: 20 + Math.round(Math.random() * 5),
      required_nurses: 40 + Math.round(Math.random() * 10),
      required_technicians: 15 + Math.round(Math.random() * 5)
    })),
    model: 'Time Series (fallback mock)'
  };
}

module.exports = router;
