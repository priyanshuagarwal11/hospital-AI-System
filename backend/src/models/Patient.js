// ============================================================
// models/Patient.js - Patient Admission Schema
// ============================================================

const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 0,
    max: 150
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  contact: {
    phone: String,
    address: String,
    emergencyContact: String
  },
  admissionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dischargeDate: Date,
  department: {
    type: String,
    required: true,
    enum: ['ICU', 'General', 'Emergency', 'Pediatrics', 'Maternity', 'Surgery', 'Cardiology', 'Orthopedics', 'Neurology', 'Oncology']
  },
  bed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bed'
  },
  attendingDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  diagnosis: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['critical', 'serious', 'moderate', 'mild', 'stable'],
    default: 'moderate'
  },
  status: {
    type: String,
    enum: ['admitted', 'discharged', 'transferred', 'deceased'],
    default: 'admitted'
  },
  insuranceProvider: String,
  notes: String
}, {
  timestamps: true
});

// ── Virtual: Length of Stay ────────────────────────────────
patientSchema.virtual('lengthOfStay').get(function() {
  const end = this.dischargeDate || new Date();
  const diff = end - this.admissionDate;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

patientSchema.set('toJSON', { virtuals: true });
patientSchema.index({ department: 1, status: 1, admissionDate: -1 });

module.exports = mongoose.model('Patient', patientSchema);
