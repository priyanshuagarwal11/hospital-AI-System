import React from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { 
  TrendingUp, Clock, ShieldCheck, Database, 
  Award, Zap, Activity, Users, BedDouble
} from 'lucide-react'

// --- Mock Data for Jury Demo ---

const adminMetrics = [
  { label: 'Total Predictions Processed', value: '1,452,019', icon: Database, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { label: 'System Uptime (90 Days)', value: '99.98%', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { label: 'Avg Inference Time', value: '0.8ms', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { label: 'Active ML Models', value: '3 Ensemble', icon: Activity, color: 'text-violet-400', bg: 'bg-violet-500/10' },
]

const beforeAfterData = [
  { metric: 'ER Wait (mins)', 'Before AI': 45, 'With AI': 12 },
  { metric: 'Bed Allocation (mins)', 'Before AI': 120, 'With AI': 15 },
  { metric: 'Staff Overtime (hrs/wk)', 'Before AI': 240, 'With AI': 45 },
  { metric: 'Code Blue Delays', 'Before AI': 14, 'With AI': 1 }
]

// Generate 30 days of accuracy climbing from 75% to 92.4%
const accuracyTrendData = Array.from({ length: 30 }, (_, i) => {
  const day = new Date()
  day.setDate(day.getDate() - (29 - i))
  // Logistic curve simulation
  const base = 75 + (18 / (1 + Math.exp(-0.3 * (i - 15))))
  const noise = (Math.random() - 0.5) * 2
  return {
    date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    accuracy: Number((base + noise).toFixed(1))
  }
})

// Generate 6 months of resource savings (Cost & Time)
const savingsData = [
  { month: 'Oct', 'Resource Savings ($k)': 12, 'Hours Saved': 120 },
  { month: 'Nov', 'Resource Savings ($k)': 24, 'Hours Saved': 250 },
  { month: 'Dec', 'Resource Savings ($k)': 45, 'Hours Saved': 410 },
  { month: 'Jan', 'Resource Savings ($k)': 78, 'Hours Saved': 650 },
  { month: 'Feb', 'Resource Savings ($k)': 112, 'Hours Saved': 890 },
  { month: 'Mar', 'Resource Savings ($k)': 145, 'Hours Saved': 1100 }
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-8">
      
      {/* ── Header ─────────────────────────────────────── */}
      <div>
        <h2 className="page-title flex items-center gap-2">
          <Award className="w-6 h-6 text-sky-400" />
          Performance Analytics & ROI
        </h2>
        <p className="page-subtitle">Executive overview of AI system impact, accuracy trends, and operational savings.</p>
      </div>

      {/* ── Admin Power Metrics ──────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {adminMetrics.map((m, i) => (
          <div key={i} className="card bg-slate-900/80 border-slate-700/50 hover:bg-slate-800/80 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${m.bg}`}>
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{m.label}</span>
            </div>
            <div className={`text-2xl lg:text-3xl font-display font-bold ${m.color} pl-1`}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Charts Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Before vs After Impact */}
        <div className="card border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Operational Impact (Before vs After AI)
              </h3>
              <p className="text-xs text-slate-500 mt-1">Measuring reduction in bottlenecks</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={beforeAfterData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip 
                cursor={{ fill: '#1e293b', opacity: 0.4 }}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
              <Bar dataKey="Before AI" fill="#475569" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar dataKey="With AI" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Accuracy Trend */}
        <div className="card border-slate-700/50">
           <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                ML Model Accuracy Trend (30 Days)
              </h3>
              <p className="text-xs text-slate-500 mt-1">Continuous learning validation</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={accuracyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} minTickGap={20} />
              <YAxis domain={['dataMin - 2', 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(tick) => `${tick}%`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                itemStyle={{ color: '#38bdf8' }}
              />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#38bdf8" 
                strokeWidth={3}
                dot={{ r: 2, fill: '#38bdf8', strokeWidth: 2, stroke: '#0f172a' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="Prediction Accuracy %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Resource ROI */}
        <div className="card border-slate-700/50 xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-violet-400" />
                Cumulative Resource & Cost Savings
              </h3>
              <p className="text-xs text-slate-500 mt-1">ROI tracking across beds, staff utilization, and equipment maintenance</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={savingsData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${v}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `${v}h`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area yAxisId="left" type="monotone" dataKey="Resource Savings ($k)" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
              <Area yAxisId="right" type="monotone" dataKey="Hours Saved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}
