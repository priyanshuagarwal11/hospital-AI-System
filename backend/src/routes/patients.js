// ============================================================
// routes/patients.js - Patient Admission REST API
// ============================================================

const express = require('express');
const Patient = require('../models/Patient');
const Bed     = require('../models/Bed');
const Alert   = require('../models/Alert');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/patients/stats
router.get('/stats', async (req, res) => {
  try {
    const total    = await Patient.countDocuments({ status: 'admitted' });
    const today    = new Date(); today.setHours(0,0,0,0);
    const admitted = await Patient.countDocuments({ admissionDate: { $gte: today } });
    const discharged = await Patient.countDocuments({ dischargeDate: { $gte: today }, status: 'discharged' });

    const bySeverity = await Patient.aggregate([
      { $match: { status: 'admitted' } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    const byDepartment = await Patient.aggregate([
      { $match: { status: 'admitted' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Last 7 days admissions trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const trend = await Patient.aggregate([
      { $match: { admissionDate: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$admissionDate' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: { total, admittedToday: admitted, dischargedToday: discharged, bySeverity, byDepartment, trend } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/patients
router.get('/', async (req, res) => {
  try {
    const { department, status, severity, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (status)     filter.status     = status;
    if (severity)   filter.severity   = severity;
    if (search)     filter.name       = { $regex: search, $options: 'i' };

    const skip  = (page - 1) * limit;
    const total = await Patient.countDocuments(filter);
    const patients = await Patient.find(filter)
      .populate('bed', 'bedNumber ward')
      .populate('attendingDoctor', 'name role')
      .sort({ admissionDate: -1 })
      .skip(skip).limit(Number(limit));

    res.json({ success: true, count: patients.length, total, data: patients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/patients
router.post('/', async (req, res) => {
  try {
    const patient = await Patient.create(req.body);

    // If bed assigned, mark it as occupied
    if (req.body.bed) {
      await Bed.findByIdAndUpdate(req.body.bed, { status: 'occupied', patient: patient._id });
    }

    // Alert if critical patient
    if (patient.severity === 'critical') {
      await Alert.create({
        type: 'critical_patient',
        severity: 'critical',
        title: 'Critical Patient Admitted',
        message: `Patient ${patient.name} admitted to ${patient.department} with critical condition: ${patient.diagnosis}`,
        department: patient.department,
        resourceId: patient._id,
        resourceType: 'Patient'
      });
    }

    res.status(201).json({ success: true, message: 'Patient admitted', data: patient });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/patients/:id
router.get('/:id', async (req, res) => {
  try {
    const p = await Patient.findById(req.params.id).populate('bed').populate('attendingDoctor');
    if (!p) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, data: p });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/patients/:id
router.put('/:id', async (req, res) => {
  try {
    const old = await Patient.findById(req.params.id);
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    // Handle discharge: free up bed
    if (req.body.status === 'discharged' && old.status !== 'discharged' && old.bed) {
      await Bed.findByIdAndUpdate(old.bed, { status: 'available', patient: null });
    }

    res.json({ success: true, data: patient });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/patients/:id
router.delete('/:id', async (req, res) => {
  try {
    const p = await Patient.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Not found' });
    if (p.bed) await Bed.findByIdAndUpdate(p.bed, { status: 'available', patient: null });
    res.json({ success: true, message: 'Patient record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
