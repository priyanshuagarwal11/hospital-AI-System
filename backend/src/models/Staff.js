// ============================================================
// models/Staff.js - Hospital Staff Schema
// ============================================================

const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['Doctor', 'Nurse', 'Technician', 'Pharmacist', 'Admin', 'Support', 'Surgeon', 'Anesthesiologist', 'Radiologist']
  },
  department: {
    type: String,
    required: true,
    enum: ['ICU', 'General', 'Emergency', 'Pediatrics', 'Maternity', 'Surgery', 'Cardiology', 'Orthopedics', 'Neurology', 'Oncology', 'Radiology', 'Laboratory', 'Administration']
  },
  specialization: String,
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'night', 'on-call', 'off'],
    default: 'morning'
  },
  status: {
    type: String,
    enum: ['on-duty', 'off-duty', 'on-leave', 'unavailable'],
    default: 'on-duty'
  },
  contact: {
    phone: String,
    email: String
  },
  experience: {
    type: Number, // years
    min: 0
  },
  qualifications: [String],
  joiningDate: Date,
  salary: Number,
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

staffSchema.index({ department: 1, status: 1, shift: 1 });

module.exports = mongoose.model('Staff', staffSchema);
