// ============================================================
// models/Bed.js - Hospital Bed Schema
// ============================================================

const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
  bedNumber: {
    type: String,
    required: [true, 'Bed number is required'],
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['ICU', 'General', 'Emergency', 'Pediatrics', 'Maternity', 'Surgery', 'Cardiology', 'Orthopedics', 'Neurology', 'Oncology']
  },
  ward: {
    type: String,
    required: true
  },
  floor: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['standard', 'icu', 'private', 'semi-private', 'isolation'],
    default: 'standard'
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'reserved'],
    default: 'available'
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },
  features: [{
    type: String,
    enum: ['oxygen', 'ventilator', 'cardiac-monitor', 'IV-stand', 'call-button']
  }],
  lastCleaned: {
    type: Date,
    default: Date.now
  },
  notes: String
}, {
  timestamps: true
});

// ── Index for faster department/status queries ─────────────
bedSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model('Bed', bedSchema);
