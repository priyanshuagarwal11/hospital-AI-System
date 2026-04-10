import React, { useState, useEffect } from 'react'
import {
  Map, AlertOctagon, Activity, Zap, CheckCircle2, Siren, UserPlus, Flame, MoveRight, Stethoscope, Clock
} from 'lucide-react'

// Initial state for the hospital wards
const INITIAL_WARDS = {
  ER:        { name: 'Emergency Room', capacity: 40, occupied: 15, type: 'critical' },
  ICU:       { name: 'Intensive Care Unit', capacity: 30, occupied: 22, type: 'critical' },
  General:   { name: 'General Ward Alpha', capacity: 120, occupied: 85, type: 'standard' },
  Surgery:   { name: 'Surgical Wing', capacity: 45, occupied: 30, type: 'critical' },
  Pediatrics:{ name: 'Pediatrics', capacity: 50, occupied: 20, type: 'standard' },
  Maternity: { name: 'Maternity Ward', capacity: 35, occupied: 18, type: 'standard' }
}

export default function CommandCenterPage() {
  const [wards, setWards] = useState(INITIAL_WARDS)
  const [logs, setLogs] = useState([])
  
  // Triage Form State
  const [tPatient, setTPatient] = useState({ age: '', symptom: '', severity: 5 })
  const [isTriaging, setIsTriaging] = useState(false)

  // Add a log entry
  const addLog = (msg, type = 'info') => {
    setLogs(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 8))
  }

  // Effect to listen for capacity tipping points
  useEffect(() => {
    Object.keys(wards).forEach(key => {
      const w = wards[key]
      const rate = w.occupied / w.capacity
      if (rate > 0.85 && w.lastAlert !== 'critical') {
        addLog(`[AI OPTIMIZATION] ${w.name} exceeding 85% capacity. Automatically mobilizing 3 reserve shift nurses.`, 'warning')
        setWards(prev => ({ ...prev, [key]: { ...w, lastAlert: 'critical' } }))
      } else if (rate <= 0.85 && w.lastAlert === 'critical') {
        setWards(prev => ({ ...prev, [key]: { ...w, lastAlert: 'normal' } }))
      }
    })
  }, [wards])

  // --- 1. AI Patient Triage Logic ---
  const handleTriage = (e) => {
    e.preventDefault()
    setIsTriaging(true)
    
    setTimeout(() => {
      let targetWard = 'General'
      
      // Basic AI rule-engine mock
      if (tPatient.severity >= 8 || tPatient.symptom.toLowerCase().includes('heart')) {
        targetWard = 'ICU'
      } else if (tPatient.symptom.toLowerCase().includes('bleed') || tPatient.symptom.toLowerCase().includes('trauma')) {
        targetWard = 'ER'
      } else if (tPatient.age < 16) {
        targetWard = 'Pediatrics'
      } else if (tPatient.symptom.toLowerCase().includes('pregnant') || tPatient.symptom.toLowerCase().includes('labor')) {
        targetWard = 'Maternity'
      }

      setWards(prev => {
        const w = prev[targetWard]
        return {
          ...prev,
          [targetWard]: { ...w, occupied: Math.min(w.capacity, w.occupied + 1) }
        }
      })

      addLog(`[AI TRIAGE] Routed 1 new patient (Severity: ${tPatient.severity}) directly to ${INITIAL_WARDS[targetWard].name}.`, 'success')
      setTPatient({ age: '', symptom: '', severity: 5 })
      setIsTriaging(false)
    }, 800)
  }



  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Map className="w-6 h-6 text-indigo-400" />
            Hospital Command Center
          </h2>
          <p className="page-subtitle">Real-time geo-spatial capacity, disaster simulation, and AI Operations.</p>
        </div>
      </div>

      {/* ── Top Row Controls ───────────────────────────── */}
      <div className="max-w-2xl mb-8">

        {/* AI Triage Desk */}
        <div className="card border-sky-500/20">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2 mb-4">
            <Stethoscope className="w-4 h-4 text-sky-400" />
            Auto-Triage Desk
          </h3>
          <p className="text-sm text-slate-400 mb-5">Instantly route an arriving patient to the optimal ward via ML logic.</p>
          <form onSubmit={handleTriage} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 pl-1">Age</label>
                <input required type="number" min="0" max="120" value={tPatient.age} onChange={e => setTPatient({...tPatient, age: e.target.value})} className="input w-full" placeholder="e.g. 45" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1 pl-1">Primary Symptom</label>
                <input required type="text" value={tPatient.symptom} onChange={e => setTPatient({...tPatient, symptom: e.target.value})} className="input w-full" placeholder="e.g. chest pain, trauma" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 pl-1 flex justify-between">
                <span>Severity Assessment (1-10)</span>
                <span className={`font-bold ${tPatient.severity > 7 ? 'text-red-400' : 'text-sky-400'}`}>{tPatient.severity}</span>
              </label>
              <input type="range" min="1" max="10" value={tPatient.severity} onChange={e => setTPatient({...tPatient, severity: parseInt(e.target.value)})} className="w-full accent-sky-500" />
            </div>
            <button type="submit" disabled={isTriaging} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {isTriaging ? <Activity className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {isTriaging ? 'AI Validating Rules...' : 'Auto-Assign Patient'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Real-Time Heatmap & Event Log ──────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Hospital Floorplan Component */}
        <div className="xl:col-span-2 card border-slate-700/50 bg-slate-950">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2 mb-6">
            <Map className="w-4 h-4 text-indigo-400" />
            Live Structural Heatmap
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
            {Object.entries(wards).map(([id, w]) => {
              const util = w.occupied / w.capacity
              let stateClass = 'border-emerald-500/40 bg-emerald-500/10'
              let textClass = 'text-emerald-400'
              let barClass = 'bg-emerald-500'
              let isAlarm = false

              if (util > 0.85) {
                stateClass = 'border-red-500/60 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse'
                textClass = 'text-red-400'
                barClass = 'bg-red-500'
                isAlarm = true
              } else if (util > 0.60) {
                stateClass = 'border-orange-500/40 bg-orange-500/10'
                textClass = 'text-orange-400'
                barClass = 'bg-orange-500'
              }

              return (
                <div key={id} className={`p-4 rounded-xl border ${stateClass} transition-all duration-500 relative overflow-hidden h-32 flex flex-col justify-between`}>
                  
                  {isAlarm && (
                    <div className="absolute top-0 right-0 p-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] animate-ping" />
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{w.name}</div>
                    <div className={`text-2xl font-display font-bold ${textClass}`}>
                      {w.occupied} <span className="text-sm font-sans text-slate-500 font-medium">/ {w.capacity}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium text-slate-400">
                      <span>Occupancy</span>
                      <span>{Math.round(util * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ease-out ${barClass}`} style={{ width: `${Math.min(100, util * 100)}%` }} />
                    </div>
                  </div>
                  
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Operational Event Log */}
        <div className="card border-slate-700/50 flex flex-col h-[400px] xl:h-[500px]">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2 mb-4 shrink-0">
            <Zap className="w-4 h-4 text-amber-400" />
            AI Operations Feed
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {logs.length === 0 && (
              <div className="text-center text-sm text-slate-500 py-10">Monitoring hospital systems...</div>
            )}
            {logs.map((log) => (
               <div key={log.id} className="text-sm p-3 rounded-xl border border-slate-700/50 bg-slate-800/30 animate-fade-in">
                 <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1.5">
                   <Clock className="w-3 h-3" /> {log.time}
                 </div>
                 <div className={`
                    ${log.type === 'danger' ? 'text-red-400' : ''}
                    ${log.type === 'warning' ? 'text-orange-400' : ''}
                    ${log.type === 'success' ? 'text-emerald-400' : ''}
                    ${log.type === 'info' ? 'text-sky-400' : ''}
                 `}>
                   {log.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />}
                   {log.msg}
                 </div>
               </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
