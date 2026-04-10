// ============================================================
// components/Layout/AppLayout.jsx - Main shell with sidebar
// ============================================================

import React, { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, BedDouble, Cpu, Brain, FileBarChart,
  BellRing, LogOut, Menu, X, ChevronRight, Activity,
  Stethoscope, Users, Zap, Shield, CloudSun, Award, Map, Droplet
} from 'lucide-react'
import AlertBadge from '../UI/AlertBadge'

const NAV_ITEMS = [
  { path: '/dashboard',   label: 'Dashboard',    icon: LayoutDashboard, desc: 'Overview & KPIs' },
  { path: '/resources',   label: 'Resources',    icon: BedDouble,       desc: 'Beds, Staff, Equipment' },
  { path: '/command',     label: 'Command Center', icon: Map,           desc: 'Live Operations' },
  { path: '/predictions', label: 'AI Predictions', icon: Brain,         desc: 'ML Forecasting' },
  { path: '/blood-bank',  label: 'Blood Bank',   icon: Droplet,         desc: 'Inventory & Alerts' },
  { path: '/weather',     label: 'Weather Impact', icon: CloudSun,      desc: '7-Day Correlation' },
  { path: '/analytics',   label: 'System Analytics', icon: Award,       desc: 'Performance & ROI' },
  { path: '/alerts',      label: 'Alerts',       icon: BellRing,        desc: 'Notifications', badge: true },
  { path: '/reports',     label: 'Reports',      icon: FileBarChart,    desc: 'Analytics & Export' }
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const currentPage = NAV_ITEMS.find(n => location.pathname.startsWith(n.path))

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">

      {/* ── Mobile overlay ──────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-slate-900 border-r border-slate-800
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-sky-500/25">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-tight">MedOptima</div>
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">AI System</div>
          </div>
          <button className="ml-auto lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 mb-3">
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Navigation</span>
          </div>

          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 group relative
                ${isActive
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sky-400 rounded-full" />
                  )}
                  <item.icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && <AlertBadge />}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-sky-400/60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User panel */}
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200 truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-16 flex items-center gap-4 px-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm flex-shrink-0">
          <button
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold text-white">{currentPage?.label || 'Dashboard'}</h1>
              <span className="hidden sm:inline text-xs text-slate-500 px-2 py-0.5 rounded-full border border-slate-800">
                {currentPage?.desc}
              </span>
            </div>
          </div>

          {/* Status indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">System Online</span>
          </div>

          {/* Live time */}
          <LiveClock />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function LiveClock() {
  const [time, setTime] = React.useState(new Date())
  React.useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="hidden md:block text-right">
      <div className="text-xs font-mono text-slate-400">
        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-[10px] text-slate-600">
        {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>
  )
}
