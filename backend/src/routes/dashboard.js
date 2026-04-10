// ============================================================
// routes/dashboard.js - Unified Dashboard Statistics
// ============================================================

const express   = require('express');
const Bed       = require('../models/Bed');
const Equipment = require('../models/Equipment');
const Staff     = require('../models/Staff');
const Patient   = require('../models/Patient');
const Alert     = require('../models/Alert');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/dashboard/overview
router.get('/overview', async (req, res) => {
  try {
    const [
      totalBeds, availableBeds, occupiedBeds,
      totalStaff, onDutyStaff,
      totalEquipment, equipmentInUse,
      totalPatients, criticalPatients,
      unreadAlerts
    ] = await Promise.all([
      Bed.countDocuments(),
      Bed.countDocuments({ status: 'available' }),
      Bed.countDocuments({ status: 'occupied' }),
      Staff.countDocuments({ isActive: true }),
      Staff.countDocuments({ status: 'on-duty', isActive: true }),
      Equipment.aggregate([{ $group: { _id: null, total: { $sum: '$quantity' } } }]).then(r => r[0]?.total || 0),
      Equipment.aggregate([{ $group: { _id: null, total: { $sum: '$inUse' } } }]).then(r => r[0]?.total || 0),
      Patient.countDocuments({ status: 'admitted' }),
      Patient.countDocuments({ status: 'admitted', severity: 'critical' }),
      Alert.countDocuments({ isRead: false, isResolved: false })
    ]);

    // Admission trend (last 14 days)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const admissionTrend = await Patient.aggregate([
      { $match: { admissionDate: { $gte: twoWeeksAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$admissionDate' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Department occupancy
    const departmentOccupancy = await Bed.aggregate([
      { $group: {
        _id: '$department',
        total: { $sum: 1 },
        occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
        available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } }
      }},
      { $sort: { occupied: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        beds: { total: totalBeds, available: availableBeds, occupied: occupiedBeds, occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0 },
        staff: { total: totalStaff, onDuty: onDutyStaff, availabilityRate: totalStaff > 0 ? Math.round((onDutyStaff / totalStaff) * 100) : 0 },
        equipment: { total: totalEquipment, inUse: equipmentInUse, available: totalEquipment - equipmentInUse, utilizationRate: totalEquipment > 0 ? Math.round((equipmentInUse / totalEquipment) * 100) : 0 },
        patients: { total: totalPatients, critical: criticalPatients },
        alerts: { unread: unreadAlerts },
        admissionTrend,
        departmentOccupancy
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
