// ============================================================
// components/UI/index.jsx - Shared UI building blocks
// ============================================================
import React from 'react'
import { AlertCircle, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ── Spinner ──────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' }
  return <Loader2 className={`${sz[size]} animate-spin text-sky-400 ${className}`} />
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Spinner size="xl" />
      <p className="text-sm text-slate-500 animate-pulse">Loading data…</p>
    </div>
  )
}

// ── Error state ───────────────────────────────────────────────
export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-slate-300 font-medium">{message}</p>
        <p className="text-sm text-slate-500 mt-1">Please try again</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          Retry
        </button>
      )}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Icon className="w-6 h-6 text-slate-500" />
        </div>
      )}
      <div>
        <p className="text-slate-300 font-medium">{title}</p>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────
export function StatCard({ title, value, subtitle, icon: Icon, color = 'sky', trend, trendValue, loading }) {
  const colorMap = {
    sky:    { bg: 'from-sky-500/10 to-sky-500/5',     border: 'border-sky-500/20', icon: 'bg-sky-500/10 text-sky-400', glow: 'shadow-sky-500/10' },
    emerald:{ bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20', icon: 'bg-emerald-500/10 text-emerald-400', glow: 'shadow-emerald-500/10' },
    amber:  { bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/20', icon: 'bg-amber-500/10 text-amber-400', glow: 'shadow-amber-500/10' },
    red:    { bg: 'from-red-500/10 to-red-500/5',     border: 'border-red-500/20',   icon: 'bg-red-500/10 text-red-400',   glow: 'shadow-red-500/10' },
    violet: { bg: 'from-violet-500/10 to-violet-500/5', border: 'border-violet-500/20', icon: 'bg-violet-500/10 text-violet-400', glow: 'shadow-violet-500/10' },
    cyan:   { bg: 'from-cyan-500/10 to-cyan-500/5',   border: 'border-cyan-500/20', icon: 'bg-cyan-500/10 text-cyan-400', glow: 'shadow-cyan-500/10' }
  }
  const c = colorMap[color] || colorMap.sky

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500'

  return (
    <div className={`stat-card bg-gradient-to-br ${c.bg} border ${c.border} shadow-lg ${c.glow} animate-slide-up`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center border ${c.border}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {trendValue}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-8 w-24 rounded-lg" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
      ) : (
        <>
          <div className="text-3xl font-display font-bold text-white tracking-tight">{value}</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">{title}</div>
          {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
        </>
      )}
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'sky', showLabel = true, size = 'md' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const autoColor = pct >= 90 ? 'red' : pct >= 70 ? 'amber' : 'emerald'
  const c = color === 'auto' ? autoColor : color
  const colorMap = {
    sky: 'bg-sky-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500',
    red: 'bg-red-500', violet: 'bg-violet-500', cyan: 'bg-cyan-500'
  }
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{value}</span><span>{pct}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-800 rounded-full ${heights[size]} overflow-hidden`}>
        <div
          className={`${heights[size]} rounded-full ${colorMap[c]} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }} 
        />
      </div>
    </div>
  )
}

// ── Simple Modal ──────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="font-display text-base font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-800 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}

// ── Badge helpers ─────────────────────────────────────────────
export function SeverityBadge({ severity }) {
  const map = {
    critical: 'badge-critical', serious: 'badge-high', high: 'badge-high',
    moderate: 'badge-medium', medium: 'badge-medium', mild: 'badge-low',
    stable: 'badge-info', low: 'badge-low', info: 'badge-info'
  }
  return <span className={map[severity] || 'badge-info'}>{severity}</span>
}

export function StatusBadge({ status }) {
  const map = {
    available: 'badge-low', 'on-duty': 'badge-low', admitted: 'badge-info',
    occupied: 'badge-medium', 'in-use': 'badge-medium',
    maintenance: 'badge-high', 'off-duty': 'badge-medium',
    'out-of-service': 'badge-critical', discharged: 'badge-info',
    'on-leave': 'badge-medium', reserved: 'badge-medium'
  }
  return <span className={map[status] || 'badge-info'}>{status?.replace(/-/g, ' ')}</span>
}
