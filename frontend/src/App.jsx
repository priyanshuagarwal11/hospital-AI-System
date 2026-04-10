// ============================================================
// App.jsx - Root application with routing
// ============================================================

import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import LoginPage      from './pages/LoginPage'
import DashboardPage  from './pages/DashboardPage'
import ResourcePage   from './pages/ResourcePage'
import PredictionPage from './pages/PredictionPage'
import WeatherForecastPage from './pages/WeatherForecastPage'
import AnalyticsPage  from './pages/AnalyticsPage'
import CommandCenterPage from './pages/CommandCenterPage'
import BloodBankPage  from './pages/BloodBankPage'
import ReportsPage    from './pages/ReportsPage'
import AlertsPage     from './pages/AlertsPage'

// Layout
import AppLayout from './components/Layout/AppLayout'

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

          {/* Protected – wrapped in sidebar layout */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"   element={<DashboardPage />} />
            <Route path="resources"   element={<ResourcePage />} />
            <Route path="predictions" element={<PredictionPage />} />
            <Route path="command"     element={<CommandCenterPage />} />
            <Route path="blood-bank"  element={<BloodBankPage />} />
            <Route path="weather"     element={<WeatherForecastPage />} />
            <Route path="analytics"   element={<AnalyticsPage />} />
            <Route path="alerts"      element={<AlertsPage />} />
            <Route path="reports"     element={<ReportsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
