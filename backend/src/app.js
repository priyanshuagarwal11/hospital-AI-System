// ============================================================
// app.js - Main Express Application Entry Point
// Hospital AI Resource Optimization System
// ============================================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// ── Import Routes ─────────────────────────────────────────
const authRoutes       = require('./routes/auth');
const bedRoutes        = require('./routes/beds');
const equipmentRoutes  = require('./routes/equipment');
const staffRoutes      = require('./routes/staff');
const patientRoutes    = require('./routes/patients');
const predictionRoutes = require('./routes/predictions');
const alertRoutes      = require('./routes/alerts');
const reportRoutes     = require('./routes/reports');
const dashboardRoutes  = require('./routes/dashboard');

const app = express();

// ── Security Middleware ────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// ── Rate Limiting ──────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ── Body Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Database Connection ────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_ai')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/beds',        bedRoutes);
app.use('/api/equipment',   equipmentRoutes);
app.use('/api/staff',       staffRoutes);
app.use('/api/patients',    patientRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/alerts',      alertRoutes);
app.use('/api/reports',     reportRoutes);
app.use('/api/dashboard',   dashboardRoutes);

// ── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// ── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Hospital AI Backend running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API Base: http://localhost:${PORT}/api`);
});

module.exports = app;
