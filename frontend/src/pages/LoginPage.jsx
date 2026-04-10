// ============================================================
// pages/LoginPage.jsx - Authentication (Login + Register)
// ============================================================

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Activity, Eye, EyeOff, Stethoscope, Brain, Shield, BarChart3, AlertCircle } from 'lucide-react'
import { Spinner } from '../components/UI'

export default function LoginPage() {
  const { login, register, loading } = useAuth()
  const navigate = useNavigate()

  const [mode,    setMode]    = useState('login') // 'login' | 'register'
  const [error,   setError]   = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [form,    setForm]    = useState({
    name: '', email: 'admin@hospital.com', password: 'admin123',
    role: 'admin', department: 'Administration'
  })

  const update = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    const res = mode === 'login'
      ? await login(form.email, form.password)
      : await register(form)
    if (res.success) navigate('/dashboard')
    else setError(res.message)
  }

  const features = [
    { icon: Brain,       label: 'AI-Powered Predictions', desc: 'ML forecasting for beds, staff & equipment' },
    { icon: BarChart3,   label: 'Real-Time Analytics',    desc: 'Live dashboards and resource tracking' },
    { icon: Shield,      label: 'Smart Alerts',           desc: 'Proactive shortage notifications' },
    { icon: Stethoscope, label: 'Smart Recommendations',  desc: 'AI-driven optimization suggestions' }
  ]

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel – branding ─────────────────────── */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800 p-12 relative overflow-hidden">

        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-500/5 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-sky-400/3 blur-3xl" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3 mb-16">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center shadow-xl shadow-sky-500/30">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-display text-2xl font-bold text-white">MedOptima AI</div>
            <div className="text-xs text-slate-500 font-mono tracking-widest uppercase">Hospital Resource OS</div>
          </div>
        </div>

        {/* Headline */}
        <div className="relative flex-1">
          <h2 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Smarter Hospitals,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400">
              Saved Lives.
            </span>
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-12 max-w-md">
            AI-powered resource optimization for modern healthcare. Predict demand, prevent shortages, and allocate resources where they matter most.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-4 group">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-500/20 transition-colors">
                  <f.icon className="w-4.5 h-4.5 text-sky-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">{f.label}</div>
                  <div className="text-xs text-slate-500">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative grid grid-cols-3 gap-4 mt-8">
          {[['99.9%', 'Uptime'], ['<100ms', 'Response'], ['256-bit', 'Encrypted']].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="font-display text-lg font-bold text-sky-400">{v}</div>
              <div className="text-xs text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel – form ───────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-white">MedOptima AI</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-slate-400 text-sm">
              {mode === 'login' ? 'Sign in to your dashboard' : 'Set up your hospital account'}
            </p>
          </div>

          {/* Demo credentials hint */}
          {mode === 'login' && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-sky-500/5 border border-sky-500/20 text-xs text-sky-400">
              <strong>Demo:</strong> admin@hospital.com / admin123
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Full Name</label>
                <input className="input" type="text" placeholder="Dr. John Smith"
                  value={form.name} onChange={update('name')} required />
              </div>
            )}

            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="admin@hospital.com"
                value={form.email} onChange={update('email')} required />
            </div>

            

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={update('password')}
                  required
                />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Role</label>
                  <select className="input" value={form.role} onChange={update('role')}>
                    {['admin', 'doctor', 'nurse', 'staff'].map(r => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Department</label>
                  <select className="input" value={form.department} onChange={update('department')}>
                    {['Administration','General','ICU','Emergency','Cardiology','Surgery','Pediatrics','Orthopedics','Neurology','Oncology'].map(d => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading ? <Spinner size="sm" /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}
              className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
            >
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
