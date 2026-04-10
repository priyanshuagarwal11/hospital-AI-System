// ============================================================
// models/Equipment.js - Medical Equipment Schema
// ============================================================

const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true
  },
  equipmentId: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Diagnostic', 'Therapeutic', 'Life Support', 'Monitoring', 'Surgical', 'Laboratory', 'Imaging', 'Emergency']
  },
  department: {
    type: String,
    required: true,
    enum: ['ICU', 'General', 'Emergency', 'Pediatrics', 'Maternity', 'Surgery', 'Cardiology', 'Orthopedics', 'Neurology', 'Oncology', 'Radiology', 'Laboratory']
  },
  status: {
    type: String,
    enum: ['available', 'in-use', 'maintenance', 'out-of-service'],
    default: 'available'
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  inUse: {
    type: Number,
    default: 0,
    min: 0
  },
  manufacturer: String,
  model: String,
  serialNumber: String,
  purchaseDate: Date,
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  location: String,
  notes: String
}, {
  timestamps: true
});

// ── Virtual: Available count ───────────────────────────────
equipmentSchema.virtual('available').get(function() {
  return this.quantity - this.inUse;
});

// ── Virtual: Usage percentage ──────────────────────────────
equipmentSchema.virtual('usagePercent').get(function() {
  if (this.quantity === 0) return 0;
  return Math.round((this.inUse / this.quantity) * 100);
});

equipmentSchema.set('toJSON', { virtuals: true });
equipmentSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model('Equipment', equipmentSchema);
