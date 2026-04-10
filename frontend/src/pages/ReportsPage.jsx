// ============================================================
// pages/ReportsPage.jsx - Downloadable Reports & Analytics
// ============================================================

import React, { useState, useEffect, useCallback } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  FileBarChart, Download, FileText, Table2, RefreshCw,
  BedDouble, Users, Cpu, UserRound, CheckCircle2, Clock,
  ChevronDown, ChevronUp, Building2, Stethoscope, Loader2,
  FileSpreadsheet
} from 'lucide-react'
import { reportsAPI } from '../api'
import { PageLoader, ErrorState, SeverityBadge, StatusBadge } from '../components/UI'

const CSV_TYPES = [
  { key: 'patients',  label: 'Patient Records',     icon: UserRound, color: 'violet' },
  { key: 'beds',      label: 'Bed Registry',        icon: BedDouble, color: 'sky'    },
  { key: 'staff',     label: 'Staff Directory',     icon: Users,     color: 'emerald'},
  { key: 'equipment', label: 'Equipment Inventory', icon: Cpu,       color: 'amber'  }
]

const DEPT_COLORS = {
  ICU:          { bg: 'from-red-500/10 to-red-600/5',     border: 'border-red-500/20',     dot: 'bg-red-400',     text: 'text-red-400'     },
  General:      { bg: 'from-sky-500/10 to-sky-600/5',     border: 'border-sky-500/20',     dot: 'bg-sky-400',     text: 'text-sky-400'     },
  Emergency:    { bg: 'from-orange-500/10 to-orange-600/5', border: 'border-orange-500/20', dot: 'bg-orange-400',  text: 'text-orange-400'  },
  Pediatrics:   { bg: 'from-pink-500/10 to-pink-600/5',   border: 'border-pink-500/20',    dot: 'bg-pink-400',    text: 'text-pink-400'    },
  Maternity:    { bg: 'from-purple-500/10 to-purple-600/5', border: 'border-purple-500/20', dot: 'bg-purple-400',  text: 'text-purple-400'  },
  Surgery:      { bg: 'from-amber-500/10 to-amber-600/5', border: 'border-amber-500/20',   dot: 'bg-amber-400',   text: 'text-amber-400'   },
  Cardiology:   { bg: 'from-rose-500/10 to-rose-600/5',   border: 'border-rose-500/20',    dot: 'bg-rose-400',    text: 'text-rose-400'    },
  Orthopedics:  { bg: 'from-teal-500/10 to-teal-600/5',   border: 'border-teal-500/20',    dot: 'bg-teal-400',    text: 'text-teal-400'    },
  Neurology:    { bg: 'from-indigo-500/10 to-indigo-600/5', border: 'border-indigo-500/20', dot: 'bg-indigo-400',  text: 'text-indigo-400'  },
  Oncology:     { bg: 'from-cyan-500/10 to-cyan-600/5',   border: 'border-cyan-500/20',    dot: 'bg-cyan-400',    text: 'text-cyan-400'    },
}

const SEV_COLOR = {
  critical: 'text-red-400',
  serious:  'text-orange-400',
  moderate: 'text-amber-400',
  mild:     'text-emerald-400',
  stable:   'text-sky-400'
}

const BED_STATUS_COLOR = {
  occupied:    'bg-red-500/15 text-red-400 border-red-500/20',
  available:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  reserved:    'bg-amber-500/15 text-amber-400 border-amber-500/20',
  maintenance: 'bg-slate-500/15 text-slate-400 border-slate-500/20'
}

const STAFF_STATUS_COLOR = {
  'on-duty':  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'off-duty': 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  'on-leave': 'bg-amber-500/15 text-amber-400 border-amber-500/20'
}



// ── Department Detail Panel ────────────────────────────────
function DepartmentDetail({ dept, color }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('patients') // 'patients' | 'beds' | 'staff'

  useEffect(() => {
    setLoading(true)
    reportsAPI.getDepartmentDetail(dept)
      .then(r => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [dept])

  if (loading) return (
    <div className="flex items-center justify-center py-10 text-slate-500">
      <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading {dept} data…
    </div>
  )

  if (!data) return (
    <div className="text-center py-8 text-slate-500 text-sm">Failed to load data</div>
  )

  const tabs = [
    { key: 'patients', label: `Patients (${data.patients.length})`,  icon: UserRound },
    { key: 'beds',     label: `Beds (${data.beds.length})`,          icon: BedDouble },
    { key: 'staff',    label: `Staff (${data.staff.length})`,        icon: Users     }
  ]

  return (
    <div className="border-t border-slate-700/50 mt-3 pt-4">
      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 bg-slate-900 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === t.key
                ? `bg-slate-700 ${color.text} shadow`
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Patients ─────────────────────────────────────── */}
      {tab === 'patients' && (
        data.patients.length === 0
          ? <p className="text-center text-slate-500 text-sm py-6">No admitted patients in {dept}</p>
          : (
            <div className="overflow-x-auto rounded-xl border border-slate-700/50">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800/80">
                    {['ID','Name','Age','Gender','Blood','Diagnosis','Severity','Bed','Doctor','Admitted'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-slate-400 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.patients.map((p, i) => (
                    <tr key={p._id} className={`border-t border-slate-700/30 hover:bg-slate-800/40 transition-colors ${i % 2 === 0 ? 'bg-slate-900/20' : ''}`}>
                      <td className="px-3 py-2 text-slate-500 font-mono">{p.patientId}</td>
                      <td className="px-3 py-2 font-semibold text-slate-200 whitespace-nowrap">{p.name}</td>
                      <td className="px-3 py-2 text-slate-400">{p.age}</td>
                      <td className="px-3 py-2 text-slate-400 capitalize">{p.gender}</td>
                      <td className="px-3 py-2 text-slate-400">{p.bloodGroup}</td>
                      <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{p.diagnosis}</td>
                      <td className="px-3 py-2">
                        <span className={`font-semibold capitalize ${SEV_COLOR[p.severity] || 'text-slate-400'}`}>
                          {p.severity}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-400 font-mono">{p.bed?.bedNumber || '—'}</td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{p.attendingDoctor?.name || '—'}</td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                        {new Date(p.admissionDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      )}

      {/* ── Beds ─────────────────────────────────────────── */}
      {tab === 'beds' && (
        data.beds.length === 0
          ? <p className="text-center text-slate-500 text-sm py-6">No beds in {dept}</p>
          : (
            <div className="overflow-x-auto rounded-xl border border-slate-700/50">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800/80">
                    {['Bed No.','Ward','Floor','Type','Status','Last Cleaned'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-slate-400 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.beds.map((b, i) => (
                    <tr key={b._id} className={`border-t border-slate-700/30 hover:bg-slate-800/40 transition-colors ${i % 2 === 0 ? 'bg-slate-900/20' : ''}`}>
                      <td className="px-3 py-2 font-mono font-semibold text-slate-200">{b.bedNumber}</td>
                      <td className="px-3 py-2 text-slate-400">{b.ward}</td>
                      <td className="px-3 py-2 text-slate-400">{b.floor}</td>
                      <td className="px-3 py-2 text-slate-400 capitalize">{b.type}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${BED_STATUS_COLOR[b.status] || 'text-slate-400'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                        {b.lastCleaned ? new Date(b.lastCleaned).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      )}

      {/* ── Staff ────────────────────────────────────────── */}
      {tab === 'staff' && (
        data.staff.length === 0
          ? <p className="text-center text-slate-500 text-sm py-6">No active staff in {dept}</p>
          : (
            <div className="overflow-x-auto rounded-xl border border-slate-700/50">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800/80">
                    {['Staff ID','Name','Role','Shift','Status','Experience'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-slate-400 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.staff.map((s, i) => (
                    <tr key={s._id} className={`border-t border-slate-700/30 hover:bg-slate-800/40 transition-colors ${i % 2 === 0 ? 'bg-slate-900/20' : ''}`}>
                      <td className="px-3 py-2 font-mono text-slate-500">{s.staffId}</td>
                      <td className="px-3 py-2 font-semibold text-slate-200 whitespace-nowrap">{s.name}</td>
                      <td className="px-3 py-2 text-slate-300 capitalize">{s.role}</td>
                      <td className="px-3 py-2 text-slate-400 capitalize">{s.shift}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize ${STAFF_STATUS_COLOR[s.status] || 'text-slate-400'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-400">{s.experience} yr{s.experience !== 1 ? 's' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      )}
    </div>
  )
}

// ── Department Card ────────────────────────────────────────
function DepartmentCard({ dept }) {
  const [open, setOpen] = useState(false)
  const color = DEPT_COLORS[dept.department] || DEPT_COLORS.General
  const occupancy = dept.totalBeds > 0 ? Math.round(((dept.totalBeds - dept.availBeds) / dept.totalBeds) * 100) : 0

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${color.bg} ${color.border} overflow-hidden transition-all duration-300`}>
      {/* Header row — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
      >
        {/* Left: dept name + dot */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color.dot}`} />
          <div className={`font-display font-bold text-base ${color.text}`}>{dept.department}</div>
        </div>

        {/* Middle: stats chips */}
        <div className="hidden sm:flex items-center gap-3 text-xs flex-wrap">
          <span className="flex items-center gap-1 text-slate-300">
            <UserRound className="w-3.5 h-3.5 text-slate-400" />
            <strong className="text-white">{dept.patients}</strong> patients
            {dept.criticalPatients > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-semibold">
                {dept.criticalPatients} critical
              </span>
            )}
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-slate-300">
            <BedDouble className="w-3.5 h-3.5 text-slate-400" />
            <strong className="text-white">{dept.totalBeds - dept.availBeds}</strong>/{dept.totalBeds} beds
            <span className={`ml-1 text-[10px] font-semibold ${occupancy >= 90 ? 'text-red-400' : occupancy >= 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {occupancy}% full
            </span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-slate-300">
            <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
            <strong className="text-white">{dept.onDutyStaff}</strong> on duty
          </span>
        </div>

        {/* Right: chevron */}
        <div className={`flex-shrink-0 ${color.text} transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-0'}`}>
          {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Expandable detail */}
      {open && (
        <div className="px-4 pb-4">
          <DepartmentDetail dept={dept.department} color={color} />
        </div>
      )}
    </div>
  )
}

// ── Main Reports Page ──────────────────────────────────────
export default function ReportsPage() {
  const [summary,     setSummary]     = useState(null)
  const [departments, setDepartments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [downloading, setDownloading] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [sumRes, deptRes] = await Promise.all([
        reportsAPI.getSummary(),
        reportsAPI.getDepartments()
      ])
      setSummary(sumRes.data.data)
      setDepartments(deptRes.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handlePDF = async () => {
    setDownloading('pdf')
    try {
      const token = localStorage.getItem('token')
      const url   = reportsAPI.downloadPDF()
      const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const blob  = await res.blob()
      const link  = document.createElement('a')
      link.href   = URL.createObjectURL(blob)
      link.download = `hospital-report-${Date.now()}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch { alert('PDF download failed') }
    finally { setDownloading(null) }
  }

  const handleCSV = async (type, dept) => {
    const key = dept ? `${dept}__${type}` : type
    setDownloading(key)
    try {
      const token = localStorage.getItem('token')
      const url   = reportsAPI.downloadCSV(type, dept)
      const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const blob  = await res.blob()
      const link  = document.createElement('a')
      link.href   = URL.createObjectURL(blob)
      link.download = `${dept ? dept.toLowerCase() + '-' : ''}${type}-report-${Date.now()}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch { alert('CSV download failed') }
    finally { setDownloading(null) }
  }

  if (loading) return <PageLoader />
  if (error)   return <ErrorState message={error} onRetry={fetchAll} />

  const { stats, recentPatients, activeAlerts } = summary || {}

  const bedPie = [
    { name: 'Occupied',  value: stats?.occBeds || 0 },
    { name: 'Available', value: stats?.availBeds || 0 },
    { name: 'Other',     value: Math.max(0, (stats?.totalBeds || 0) - (stats?.occBeds || 0) - (stats?.availBeds || 0)) }
  ]

  const alertBySeverity = ['critical','high','medium','low','info'].map(s => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: (activeAlerts || []).filter(a => a.severity === s).length
  })).filter(a => a.value > 0)

  const PIE_COLORS = ['#ef4444','#22c55e','#f59e0b','#0ea5e9','#8b5cf6']

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-sky-400" />
            Reports &amp; Analytics
          </h2>
          <p className="page-subtitle">Department-wise drill-down, charts and downloadable reports</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary">
          <RefreshCw className="w-3.5 h-3.5" />Refresh
        </button>
      </div>

      {/* ── Export Reports ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PDF */}
        <div className="card flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="font-semibold text-slate-200">Full PDF Report</div>
              <div className="text-xs text-slate-500">All departments – patients, beds &amp; alerts</div>
            </div>
          </div>
          <button onClick={handlePDF} disabled={downloading === 'pdf'} className="btn-primary flex-shrink-0">
            {downloading === 'pdf' ? '…' : <><Download className="w-3.5 h-3.5" />PDF</>}
          </button>
        </div>

        {/* All-hospital CSVs */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Table2 className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">Full Hospital CSV Exports</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {CSV_TYPES.map(t => (
              <button key={t.key} onClick={() => handleCSV(t.key)} disabled={!!downloading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition-all disabled:opacity-50">
                <t.icon className="w-3.5 h-3.5 text-slate-400" />
                {downloading === t.key ? 'Downloading…' : t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Department-wise CSV Exports ───────────────────── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-1">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <div className="font-semibold text-slate-200">Department-wise CSV Exports</div>
        </div>
        <p className="text-xs text-slate-500 mb-4">Click a department row to download its Patients, Beds or Staff CSV</p>

        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/80">
                <th className="px-4 py-2.5 text-left text-xs text-slate-400 font-semibold">Department</th>
                <th className="px-4 py-2.5 text-center text-xs text-slate-400 font-semibold">Patients</th>
                <th className="px-4 py-2.5 text-center text-xs text-slate-400 font-semibold">Beds</th>
                <th className="px-4 py-2.5 text-center text-xs text-slate-400 font-semibold">Staff</th>
                <th className="px-4 py-2.5 text-center text-xs text-slate-400 font-semibold">Equipment</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept, i) => {
                const color = DEPT_COLORS[dept.department] || DEPT_COLORS.General
                return (
                  <tr key={dept.department} className={`border-t border-slate-700/30 hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? 'bg-slate-900/10' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
                        <span className={`font-semibold text-sm ${color.text}`}>{dept.department}</span>
                        <span className="text-xs text-slate-500 ml-1">{dept.patients} pts</span>
                      </div>
                    </td>
                    {[['patients','Patients',UserRound],['beds','Beds',BedDouble],['staff','Staff',Users],['equipment','Equipment',Cpu]].map(([type, label, Icon]) => {
                      const key = `${dept.department}__${type}`
                      return (
                        <td key={type} className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleCSV(type, dept.department)}
                            disabled={!!downloading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-slate-300 hover:text-white transition-all disabled:opacity-40 group"
                          >
                            {downloading === key
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Download className="w-3 h-3 text-slate-400 group-hover:text-emerald-400" />}
                            {label}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Summary stats ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Beds',       value: stats?.totalBeds,       sub: `${stats?.availBeds} available`,      icon: BedDouble, color:'text-sky-400'    },
          { label:'Active Patients',  value: stats?.totalPatients,   sub: `${stats?.criticalPatients} critical`, icon: UserRound, color:'text-violet-400' },
          { label:'Staff on Duty',    value: stats?.onDutyStaff,     sub: `of ${stats?.totalStaff} total`,      icon: Users,     color:'text-emerald-400' },
          { label:'Equipment in Use', value: stats?.eq?.inUse,       sub: `of ${stats?.eq?.total} total`,       icon: Cpu,       color:'text-amber-400'   }
        ].map(s => (
          <div key={s.label} className="card">
            <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
            <div className="text-2xl font-display font-bold text-white">{s.value ?? '—'}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            <div className="text-xs text-slate-600 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Department Reports ─────────────────────────────── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-sky-400" />
          <div className="font-semibold text-slate-200">Department-wise Reports</div>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Click any department to view patients, beds and staff details
        </p>
        <div className="space-y-2">
          {departments.map(dept => (
            <DepartmentCard key={dept.department} dept={dept} />
          ))}
        </div>
      </div>

      {/* ── Charts row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="font-semibold text-slate-200 mb-4">Bed Utilization Breakdown</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={bedPie}
                cx="50%" cy="50%"
                outerRadius={70}
                innerRadius={30}
                dataKey="value"
                label={({ name, percent, value }) =>
                  value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                }
                labelLine={true}
              >
                {bedPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(val) => [val, 'Beds']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="font-semibold text-slate-200 mb-4">Active Alert Distribution</div>
          {alertBySeverity.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={alertBySeverity} margin={{left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:11}} />
                <Tooltip />
                <Bar dataKey="value" name="Count" radius={[6,6,0,0]}>
                  {alertBySeverity.map((_, i) => (
                    <Cell key={i} fill={['#ef4444','#f97316','#f59e0b','#22c55e','#0ea5e9'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[160px] text-slate-500">
              <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-500/30" />
              <span className="text-sm">No active alerts</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent patients table ──────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-slate-200">Recent Patient Activity</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />Last 10 records
          </div>
        </div>
        <div className="table-container">
          <table className="table-base">
            <thead className="table-head">
              <tr>
                {['Patient','Department','Severity','Status','Admitted'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentPatients || []).map(p => (
                <tr key={p._id} className="table-row">
                  <td className="table-td font-medium text-slate-200">{p.name}</td>
                  <td className="table-td text-slate-400">{p.department}</td>
                  <td className="table-td"><SeverityBadge severity={p.severity} /></td>
                  <td className="table-td"><StatusBadge status={p.status} /></td>
                  <td className="table-td text-xs text-slate-500">
                    {new Date(p.admissionDate).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>



      {/* Active alerts */}
      {(activeAlerts || []).length > 0 && (
        <div className="card">
          <div className="font-semibold text-slate-200 mb-4">Active Alerts Summary</div>
          <div className="space-y-2">
            {activeAlerts.slice(0, 5).map(a => (
              <div key={a._id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className={`badge ${
                  a.severity === 'critical' ? 'badge-critical' :
                  a.severity === 'high'     ? 'badge-high'     :
                  a.severity === 'medium'   ? 'badge-medium'   : 'badge-low'
                }`}>{a.severity}</span>
                <div>
                  <div className="text-sm font-medium text-slate-200">{a.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{a.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
