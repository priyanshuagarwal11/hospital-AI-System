// ============================================================
// routes/reports.js - Downloadable Reports (PDF / CSV)
// ============================================================

const express   = require('express');
const PDFKit    = require('pdfkit');
const { Parser } = require('json2csv');
const Bed       = require('../models/Bed');
const Equipment = require('../models/Equipment');
const Staff     = require('../models/Staff');
const Patient   = require('../models/Patient');
const Alert     = require('../models/Alert');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// ── Helper: Gather full stats ──────────────────────────────
async function gatherStats() {
  const [totalBeds, availBeds, occBeds, totalStaff, onDutyStaff] = await Promise.all([
    Bed.countDocuments(),
    Bed.countDocuments({ status: 'available' }),
    Bed.countDocuments({ status: 'occupied' }),
    Staff.countDocuments({ isActive: true }),
    Staff.countDocuments({ status: 'on-duty', isActive: true })
  ]);
  const equipAgg = await Equipment.aggregate([
    { $group: { _id: null, total: { $sum: '$quantity' }, inUse: { $sum: '$inUse' } } }
  ]);
  const eq = equipAgg[0] || { total: 0, inUse: 0 };
  const totalPatients = await Patient.countDocuments({ status: 'admitted' });
  const criticalPatients = await Patient.countDocuments({ status: 'admitted', severity: 'critical' });
  return { totalBeds, availBeds, occBeds, totalStaff, onDutyStaff, eq, totalPatients, criticalPatients };
}

// ── GET /api/reports/pdf ───────────────────────────────────
router.get('/pdf', async (req, res) => {
  try {
    const stats = await gatherStats();
    const patients = await Patient.find({ status: 'admitted' })
      .populate('bed', 'bedNumber').populate('attendingDoctor', 'name').limit(50);
    const alerts = await Alert.find({ isResolved: false }).sort({ createdAt: -1 }).limit(20);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=hospital-report-${Date.now()}.pdf`);

    const doc = new PDFKit({ margin: 50, size: 'A4' });
    doc.pipe(res);

    // ── Cover / Header ─────────────────────────────────────
    doc.rect(0, 0, 612, 120).fill('#0f172a');
    doc.fillColor('#38bdf8').fontSize(26).font('Helvetica-Bold')
       .text('🏥  MedOptima AI', 50, 35);
    doc.fillColor('#94a3b8').fontSize(12).font('Helvetica')
       .text('Hospital Resource Optimization Report', 50, 68);
    doc.fillColor('#64748b').fontSize(10)
       .text(`Generated: ${new Date().toLocaleString()}`, 50, 88);
    doc.moveDown(3);

    // ── Summary Stats ──────────────────────────────────────
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text('Executive Summary', 50, 140);
    doc.moveTo(50, 160).lineTo(560, 160).strokeColor('#e2e8f0').stroke();

    const summaryY = 170;
    const cols = [
      { label: 'Total Beds', value: stats.totalBeds, sub: `${stats.availBeds} Available` },
      { label: 'Occupancy Rate', value: `${Math.round((stats.occBeds/Math.max(stats.totalBeds,1))*100)}%`, sub: `${stats.occBeds} Occupied` },
      { label: 'Staff On Duty', value: stats.onDutyStaff, sub: `of ${stats.totalStaff} total` },
      { label: 'Active Patients', value: stats.totalPatients, sub: `${stats.criticalPatients} Critical` }
    ];

    cols.forEach((col, i) => {
      const x = 50 + i * 130;
      doc.rect(x, summaryY, 120, 60).fill('#f8fafc').stroke('#e2e8f0');
      doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text(String(col.value), x + 10, summaryY + 8);
      doc.fillColor('#64748b').fontSize(9).font('Helvetica').text(col.label, x + 10, summaryY + 36);
      doc.fillColor('#94a3b8').fontSize(8).text(col.sub, x + 10, summaryY + 48);
    });

    doc.moveDown(6);

    // ── Patient List ───────────────────────────────────────
    doc.y = summaryY + 80;
    doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('Current Admissions (top 50)');
    doc.moveTo(50, doc.y + 4).lineTo(560, doc.y + 4).strokeColor('#e2e8f0').stroke();
    doc.moveDown(0.5);

    const headers = ['Patient', 'Dept', 'Severity', 'Diagnosis', 'Bed', 'Days'];
    const colWidths = [110, 80, 70, 140, 60, 40];
    let xPos = 50;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569');
    headers.forEach((h, i) => { doc.text(h, xPos, doc.y, { width: colWidths[i] }); xPos += colWidths[i]; });
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor('#cbd5e1').stroke();
    doc.moveDown(0.3);

    const severityColor = { critical: '#ef4444', serious: '#f97316', moderate: '#f59e0b', mild: '#22c55e', stable: '#06b6d4' };
    patients.forEach((p, idx) => {
      if (doc.y > 720) { doc.addPage(); }
      const rowY = doc.y;
      if (idx % 2 === 0) doc.rect(50, rowY - 2, 510, 16).fill('#f8fafc');
      xPos = 50;
      doc.fontSize(8).font('Helvetica').fillColor('#1e293b');
      const rowData = [
        p.name?.substring(0, 18) || '-',
        p.department || '-',
        p.severity || '-',
        (p.diagnosis || '-').substring(0, 22),
        p.bed?.bedNumber || '-',
        String(p.lengthOfStay || 0)
      ];
      rowData.forEach((d, i) => {
        if (i === 2) doc.fillColor(severityColor[d] || '#64748b');
        else doc.fillColor('#1e293b');
        doc.text(d, xPos, rowY, { width: colWidths[i], lineBreak: false });
        xPos += colWidths[i];
      });
      doc.moveDown(0.5);
    });

    // ── Alerts Section ─────────────────────────────────────
    if (doc.y > 650) doc.addPage();
    doc.moveDown(1);
    doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('Active Alerts');
    doc.moveTo(50, doc.y + 4).lineTo(560, doc.y + 4).strokeColor('#e2e8f0').stroke();
    doc.moveDown(0.5);

    alerts.forEach(alert => {
      if (doc.y > 720) doc.addPage();
      const severityColors2 = { critical: '#fef2f2', high: '#fff7ed', medium: '#fefce8', low: '#f0fdf4' };
      const borderCol = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
      doc.rect(50, doc.y - 2, 510, 30).fill(severityColors2[alert.severity] || '#f8fafc');
      doc.moveTo(50, doc.y - 2).lineTo(50, doc.y + 28).strokeColor(borderCol[alert.severity] || '#94a3b8').lineWidth(3).stroke();
      doc.lineWidth(1);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b').text(alert.title, 60, doc.y);
      doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(alert.message, 60, doc.y + 1);
      doc.moveDown(2);
    });

    // ── Footer ─────────────────────────────────────────────
    doc.fontSize(8).fillColor('#94a3b8').text(
      'Generated by MedOptima AI — Hospital Resource Optimization System',
      50, 800, { align: 'center' }
    );

    doc.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/reports/csv?type=patients|beds|staff|equipment[&dept=ICU]
router.get('/csv', async (req, res) => {
  try {
    const { type = 'patients', dept } = req.query;
    const deptFilter = dept ? { department: dept } : {};
    let data = [], fields = [];

    if (type === 'patients') {
      data = await Patient.find(deptFilter)
        .populate('bed', 'bedNumber').populate('attendingDoctor', 'name').lean();
      fields = ['patientId','name','age','gender','bloodGroup','department','severity','status','diagnosis','admissionDate','dischargeDate'];
    } else if (type === 'beds') {
      data = await Bed.find(deptFilter).lean();
      fields = ['bedNumber','department','ward','floor','type','status','lastCleaned'];
    } else if (type === 'staff') {
      data = await Staff.find({ isActive: true, ...deptFilter }).lean();
      fields = ['staffId','name','role','department','shift','status','experience'];
    } else if (type === 'equipment') {
      data = await Equipment.find(deptFilter).lean();
      fields = ['equipmentId','name','category','department','status','quantity','inUse'];
    }

    const parser = new Parser({ fields });
    const csv    = parser.parse(data);
    const suffix = dept ? `${dept.toLowerCase()}-${type}` : type;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${suffix}-report-${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ── GET /api/reports/summary - JSON summary for UI ────────
router.get('/summary', async (req, res) => {
  try {
    const stats = await gatherStats();
    const recentPatients = await Patient.find().sort({ createdAt: -1 }).limit(10)
      .select('name department severity status admissionDate');
    const activeAlerts = await Alert.find({ isResolved: false }).sort({ createdAt: -1 }).limit(10);

    res.json({ success: true, data: { stats, recentPatients, activeAlerts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/reports/departments - all dept summaries ─────
router.get('/departments', async (req, res) => {
  try {
    const DEPARTMENTS = ['ICU','General','Emergency','Pediatrics','Maternity','Surgery','Cardiology','Orthopedics','Neurology','Oncology'];
    const summaries = await Promise.all(DEPARTMENTS.map(async dept => {
      const [patients, totalBeds, availBeds, staff] = await Promise.all([
        Patient.countDocuments({ department: dept, status: 'admitted' }),
        Bed.countDocuments({ department: dept }),
        Bed.countDocuments({ department: dept, status: 'available' }),
        Staff.countDocuments({ department: dept, isActive: true, status: 'on-duty' })
      ]);
      const criticalPatients = await Patient.countDocuments({ department: dept, status: 'admitted', severity: 'critical' });
      return { department: dept, patients, criticalPatients, totalBeds, availBeds, onDutyStaff: staff };
    }));
    res.json({ success: true, data: summaries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/reports/department/:dept - full drill-down ───
router.get('/department/:dept', async (req, res) => {
  try {
    const dept = req.params.dept;
    const [patients, beds, staff] = await Promise.all([
      Patient.find({ department: dept, status: 'admitted' })
        .populate('bed', 'bedNumber ward floor')
        .populate('attendingDoctor', 'name role')
        .select('patientId name age gender bloodGroup diagnosis severity status admissionDate bed attendingDoctor')
        .sort({ severity: 1, admissionDate: 1 })
        .lean(),
      Bed.find({ department: dept })
        .select('bedNumber ward floor type status lastCleaned')
        .sort({ bedNumber: 1 })
        .lean(),
      Staff.find({ department: dept, isActive: true })
        .select('staffId name role shift status experience')
        .sort({ status: 1, role: 1 })
        .lean()
    ]);
    res.json({ success: true, data: { department: dept, patients, beds, staff } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
