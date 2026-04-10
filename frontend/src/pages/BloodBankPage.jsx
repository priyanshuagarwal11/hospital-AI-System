import React, { useState } from 'react'
import {
  Droplet, AlertTriangle, Send, RefreshCw, Smartphone, 
  Activity, ArrowRightLeft, ShieldCheck, ThermometerSnowflake, CheckCircle2, Zap
} from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts'

// --- Mock Data ---

const INVENTORY = [
  { type: 'O-',   units: 12,  usedToday: 38, total: 50,  threshold: 25, status: 'critical' },
  { type: 'A+',   units: 145, usedToday: 15, total: 160, threshold: 50, status: 'safe' },
  { type: 'B+',   units: 85,  usedToday: 20, total: 105, threshold: 40, status: 'safe' },
  { type: 'AB-',  units: 8,   usedToday: 12, total: 20,  threshold: 15, status: 'warning' },
  { type: 'O+',   units: 92,  usedToday: 48, total: 140, threshold: 80, status: 'warning' },
  { type: 'A-',   units: 45,  usedToday: 15, total: 60,  threshold: 30, status: 'safe' },
  { type: 'B-',   units: 22,  usedToday: 18, total: 40,  threshold: 20, status: 'warning' },
  { type: 'AB+',  units: 56,  usedToday: 14, total: 70,  threshold: 20, status: 'safe' }
]

// Simulating a 7-day burn rate prediction for the most critical type (O-)
const burnPredictionData = [
  { day: 'Today', 'Actual Stock': 12, 'Predicted Usage': 4, 'Predicted Stock': 12 },
  { day: 'Day 1', 'Predicted Usage': 5, 'Predicted Stock': 8 },
  { day: 'Day 2', 'Predicted Usage': 3, 'Predicted Stock': 5 },
  { day: 'Day 3', 'Predicted Usage': 6, 'Predicted Stock': -1 },
  { day: 'Day 4', 'Predicted Usage': 4, 'Predicted Stock': -5 },
  { day: 'Day 5', 'Predicted Usage': 4, 'Predicted Stock': -9 },
  { day: 'Day 6', 'Predicted Usage': 3, 'Predicted Stock': -12 }
]

export default function BloodBankPage() {
  const [actionStatus, setActionStatus] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAction = (actionName) => {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      setActionStatus(`Success: ${actionName} initiated automatically by AI system.`)
      setTimeout(() => setActionStatus(null), 4000)
    }, 1500)
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Droplet className="w-6 h-6 text-red-500" />
            AI Blood Bank & Procurement
          </h2>
          <p className="page-subtitle">Real-time inventory thresholds, shortage forecasting, and smart automation.</p>
        </div>
      </div>

      {/* ── Real-Time Inventory Grid ────────────────────── */}
      <h3 className="font-semibold text-slate-200 mt-6 mb-2">Live Blood Group Reserves</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {INVENTORY.map(blood => {
          let bg = 'bg-slate-900 border-slate-700'
          let textColor = 'text-slate-300'
          let icon = null
          
          if (blood.status === 'critical') {
            bg = 'bg-red-500/10 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse'
            textColor = 'text-red-400'
            icon = <AlertTriangle className="w-3 h-3 text-red-400" />
          } else if (blood.status === 'warning') {
            bg = 'bg-orange-500/10 border-orange-500/40'
            textColor = 'text-orange-400'
          } else {
            icon = <ShieldCheck className="w-3 h-3 text-emerald-500/50" />
          }

          return (
            <div key={blood.type} className={`p-4 rounded-xl border ${bg} flex flex-col items-center justify-center relative`}>
              <div className="absolute top-2 right-2">{icon}</div>
              <div className={`text-2xl font-display font-black ${textColor} mb-1 mt-2`}>{blood.type}</div>
              
              <div className="text-2xl font-bold text-slate-200">{blood.units} <span className="text-[10px] font-normal text-slate-500 ml-0.5">REMAINING</span></div>
              
              <div className="flex justify-between w-full mt-2 pt-2 border-t border-slate-700/50 text-[10px] font-medium text-slate-400">
                <span>Used: <span className="text-slate-200">{blood.usedToday}</span></span>
                <span>Total: <span className="text-slate-200">{blood.total}</span></span>
              </div>

              <div className="w-full mt-1.5 bg-slate-800 h-1 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${blood.status === 'critical' ? 'bg-red-500' : blood.status === 'warning' ? 'bg-orange-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (blood.units / blood.total) * 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Analytical Forecast & Interventions ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Shortage Forecast Chart */}
        <div className="card lg:col-span-2 border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                7-Day Shortage Burn Forecast (Group O-)
              </h3>
              <p className="text-xs text-slate-500 mt-1">AI predicts complete stock depletion in exactly 3.2 days based on current ER trauma routing.</p>
            </div>
            <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg uppercase">
              Critical Warning
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280} className="mt-4">
            <LineChart data={burnPredictionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
              <ReferenceLine y={0} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" label={{ position: 'top', value: 'Zero Inventory Line', fill: '#ef4444', fontSize: '10px' }} />
              <Line 
                type="monotone" 
                dataKey="Predicted Stock" 
                stroke="#38bdf8" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#0f172a', strokeWidth: 2, stroke: '#38bdf8' }}
              />
              <Line 
                type="monotone" 
                dataKey="Predicted Usage" 
                stroke="#f59e0b" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* AI Action Panel */}
        <div className="card border-slate-700/50 flex flex-col">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" />
            AI Recommended Interventions
          </h3>

          <div className="space-y-4 flex-1">
            {actionStatus && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                {actionStatus}
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4 text-sky-400" />
                <span className="font-semibold text-sm text-slate-200">Broadcast Donor Alert</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Auto-sends SMS to 458 registered local O- donors warning them of urgent shortage.</p>
              <button 
                onClick={() => handleAction('Mass Donor SMS Broadcast')}
                disabled={isProcessing}
                className="w-full btn-secondary text-sky-400 border-sky-500/20 hover:bg-sky-500/10 justify-center"
              >
               {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Execute Broadcast
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRightLeft className="w-4 h-4 text-violet-400" />
                <span className="font-semibold text-sm text-slate-200">Redistribution Request</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">Requests 20 units of O- from City Center branch where predictive AI shows excess capacity.</p>
              <button 
                onClick={() => handleAction('Branch Transfer Request')}
                disabled={isProcessing}
                className="w-full btn-secondary text-violet-400 border-violet-500/20 hover:bg-violet-500/10 justify-center"
              >
               {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />} Request Transfer
              </button>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 opacity-60">
              <div className="flex items-center gap-2 mb-2">
                <ThermometerSnowflake className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-sm text-slate-200">Procure from National Bank</span>
              </div>
              <p className="text-xs text-slate-400">Not recommended currently. Expensive and long lead time. Try Branch Transfer.</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
