// ============================================================
// pages/ResourcePage.jsx - Full CRUD for all hospital resources
// ============================================================

import React, { useState, useEffect, useCallback } from 'react'
import { BedDouble, Users, Cpu, UserRound, Plus, Pencil, Trash2, Search, Filter, RefreshCw } from 'lucide-react'
import { bedsAPI, equipmentAPI, staffAPI, patientsAPI } from '../api'
import {
  PageLoader, ErrorState, EmptyState, Modal,
  StatusBadge, SeverityBadge, ProgressBar
} from '../components/UI'

const TABS = [
  { key: 'beds',      label: 'Beds',      icon: BedDouble,  color: 'sky' },
  { key: 'equipment', label: 'Equipment', icon: Cpu,        color: 'amber' },
  { key: 'staff',     label: 'Staff',     icon: Users,      color: 'emerald' },
  { key: 'patients',  label: 'Patients',  icon: UserRound,  color: 'violet' }
]

const DEPARTMENTS = ['ICU','General','Emergency','Pediatrics','Maternity','Surgery','Cardiology','Orthopedics','Neurology','Oncology']

export default function ResourcePage() {
  const [tab,      setTab]     = useState('beds')
  const [data,     setData]    = useState([])
  const [stats,    setStats]   = useState(null)
  const [loading,  setLoading] = useState(true)
  const [error,    setError]   = useState('')
  const [search,   setSearch]  = useState('')
  const [filters,  setFilters] = useState({})
  const [page,     setPage]    = useState(1)
  const [total,    setTotal]   = useState(0)
  const [modal,    setModal]   = useState({ open: false, mode: 'create', item: null })

  const API = { beds: bedsAPI, equipment: equipmentAPI, staff: staffAPI, patients: patientsAPI }

  const fetchData = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = { page, limit: 15, ...filters, ...(search ? { search } : {}) }
      const [listRes, statsRes] = await Promise.all([
        API[tab].getAll(params),
        API[tab].getStats()
      ])
      setData(listRes.data.data)
      setTotal(listRes.data.total || 0)
      setStats(statsRes.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [tab, page, filters, search])

  useEffect(() => { setPage(1); setData([]); setStats(null) }, [tab])
  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async id => {
    if (!confirm('Are you sure you want to delete this record?')) return
    try {
      await API[tab].delete(id)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    }
  }

  const openCreate = () => setModal({ open: true, mode: 'create', item: null })
  const openEdit   = item => setModal({ open: true, mode: 'edit', item })
  const closeModal = () => setModal({ open: false, mode: 'create', item: null })

  const handleSave = async formData => {
    try {
      if (modal.mode === 'create') await API[tab].create(formData)
      else await API[tab].update(modal.item._id, formData)
      closeModal(); fetchData()
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="page-title">Resource Management</h2>
          <p className="page-subtitle">View, add, edit and remove hospital resources</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />Add {tab.slice(0,-1) === 'staf' ? 'staff' : tab.slice(0,-1)}
        </button>
      </div>

      {/* Stats bar */}
      {stats && <StatsBar tab={tab} stats={stats} />}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t.key
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}>
            <t.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input pl-9" placeholder={`Search ${tab}…`}
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="input w-auto min-w-[140px]" value={filters.department || ''}
          onChange={e => setFilters(f => ({ ...f, department: e.target.value || undefined }))}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        {(tab === 'beds' || tab === 'equipment' || tab === 'staff') && (
          <select className="input w-auto min-w-[120px]" value={filters.status || ''}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value || undefined }))}>
            <option value="">All Statuses</option>
            {tab === 'beds' && ['available','occupied','maintenance','reserved'].map(s => <option key={s}>{s}</option>)}
            {tab === 'equipment' && ['available','in-use','maintenance','out-of-service'].map(s => <option key={s}>{s}</option>)}
            {tab === 'staff' && ['on-duty','off-duty','on-leave','unavailable'].map(s => <option key={s}>{s}</option>)}
          </select>
        )}
        <button onClick={fetchData} className="btn-secondary">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      {loading ? <PageLoader /> : error ? <ErrorState message={error} onRetry={fetchData} /> : (
        <>
          <div className="table-container card !p-0 overflow-hidden">
            <table className="table-base">
              <thead className="table-head">
                <tr>
                  {getColumns(tab).map(col => (
                    <th key={col.key} className="table-th">{col.label}</th>
                  ))}
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={getColumns(tab).length + 1} className="py-16">
                    <EmptyState icon={TABS.find(t=>t.key===tab)?.icon}
                      title={`No ${tab} found`} subtitle="Try adjusting your search or filters" />
                  </td></tr>
                ) : data.map(item => (
                  <tr key={item._id} className="table-row">
                    {getColumns(tab).map(col => (
                      <td key={col.key} className="table-td">
                        {renderCell(col, item)}
                      </td>
                    ))}
                    <td className="table-td text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-all">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(item._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Showing {data.length} of {total} records</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary disabled:opacity-40">Previous</button>
              <span className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300">Page {page}</span>
              <button disabled={data.length < 15} onClick={() => setPage(p => p + 1)} className="btn-secondary disabled:opacity-40">Next</button>
            </div>
          </div>
        </>
      )}

      {/* CRUD Modal */}
      <ResourceModal tab={tab} modal={modal} onClose={closeModal} onSave={handleSave} />
    </div>
  )
}

function StatsBar({ tab, stats }) {
  const items = tab === 'beds'
    ? [['Total', stats.total],['Available', stats.available],['Occupied', stats.occupied],['Maintenance', stats.maintenance]]
    : tab === 'equipment'
    ? [['Total Units', stats.totalUnits],['In Use', stats.inUse],['Available', stats.available],['Utilization', `${stats.utilizationRate}%`]]
    : tab === 'staff'
    ? [['Total', stats.total],['On Duty', stats.onDuty],['Off Duty', stats.offDuty],['On Leave', stats.onLeave]]
    : [['Admitted', stats.total],['Today', stats.admittedToday],['Discharged Today', stats.dischargedToday],['Critical', stats.bySeverity?.find(s=>s._id==='critical')?.count || 0]]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(([label, value]) => (
        <div key={label} className="card !py-3 !px-4">
          <div className="text-2xl font-display font-bold text-white">{value ?? '-'}</div>
          <div className="text-xs text-slate-400 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  )
}

function getColumns(tab) {
  const cols = {
    beds: [
      { key: 'bedNumber', label: 'Bed #' },
      { key: 'department', label: 'Department' },
      { key: 'ward', label: 'Ward' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' }
    ],
    equipment: [
      { key: 'equipmentId', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'department', label: 'Department' },
      { key: 'category', label: 'Category' },
      { key: 'usage', label: 'Usage' },
      { key: 'status', label: 'Status' }
    ],
    staff: [
      { key: 'staffId', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'department', label: 'Department' },
      { key: 'shift', label: 'Shift' },
      { key: 'status', label: 'Status' }
    ],
    patients: [
      { key: 'patientId', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'age', label: 'Age' },
      { key: 'department', label: 'Department' },
      { key: 'diagnosis', label: 'Diagnosis' },
      { key: 'severity', label: 'Severity' },
      { key: 'status', label: 'Status' }
    ]
  }
  return cols[tab] || []
}

function renderCell(col, item) {
  if (col.key === 'status') return <StatusBadge status={item.status} />
  if (col.key === 'severity') return <SeverityBadge severity={item.severity} />
  if (col.key === 'usage') {
    const pct = item.quantity > 0 ? Math.round((item.inUse / item.quantity) * 100) : 0
    return (
      <div className="min-w-[100px]">
        <div className="text-xs text-slate-400 mb-1">{item.inUse}/{item.quantity} ({pct}%)</div>
        <ProgressBar value={item.inUse} max={item.quantity} color="auto" showLabel={false} />
      </div>
    )
  }
  return <span className="text-slate-300">{item[col.key] ?? '-'}</span>
}

// ── Inline resource form modal ────────────────────────────────
function ResourceModal({ tab, modal, onClose, onSave }) {
  const defaults = {
    beds:      { bedNumber:'', department:'ICU', ward:'Ward A', floor:1, type:'standard', status:'available' },
    equipment: { name:'', equipmentId:'', category:'Monitoring', department:'ICU', status:'available', quantity:1, inUse:0, manufacturer:'' },
    staff:     { staffId:'', name:'', role:'Nurse', department:'General', shift:'morning', status:'on-duty', experience:1, 'contact.email':'' },
    patients:  { patientId:'', name:'', age:30, gender:'male', department:'General', diagnosis:'', severity:'moderate', status:'admitted', admissionDate: new Date().toISOString().split('T')[0] }
  }

  const [form, setForm] = useState(modal.item || defaults[tab] || {})
  useEffect(() => {
    setForm(modal.item ? { ...modal.item } : defaults[tab] || {})
  }, [modal.item, tab])

  const update = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const fields = {
    beds: [
      { key:'bedNumber', label:'Bed Number', type:'text', required:true },
      { key:'department', label:'Department', type:'select', options: DEPARTMENTS },
      { key:'ward', label:'Ward', type:'text' },
      { key:'floor', label:'Floor', type:'number' },
      { key:'type', label:'Type', type:'select', options:['standard','icu','private','semi-private','isolation'] },
      { key:'status', label:'Status', type:'select', options:['available','occupied','maintenance','reserved'] }
    ],
    equipment: [
      { key:'name', label:'Equipment Name', type:'text', required:true },
      { key:'equipmentId', label:'Equipment ID', type:'text', required:true },
      { key:'category', label:'Category', type:'select', options:['Diagnostic','Therapeutic','Life Support','Monitoring','Surgical','Laboratory','Imaging','Emergency'] },
      { key:'department', label:'Department', type:'select', options: DEPARTMENTS },
      { key:'status', label:'Status', type:'select', options:['available','in-use','maintenance','out-of-service'] },
      { key:'quantity', label:'Total Quantity', type:'number' },
      { key:'inUse', label:'In Use', type:'number' },
      { key:'manufacturer', label:'Manufacturer', type:'text' }
    ],
    staff: [
      { key:'staffId', label:'Staff ID', type:'text', required:true },
      { key:'name', label:'Full Name', type:'text', required:true },
      { key:'role', label:'Role', type:'select', options:['Doctor','Nurse','Technician','Pharmacist','Admin','Support','Surgeon','Anesthesiologist','Radiologist'] },
      { key:'department', label:'Department', type:'select', options: DEPARTMENTS },
      { key:'shift', label:'Shift', type:'select', options:['morning','afternoon','night','on-call','off'] },
      { key:'status', label:'Status', type:'select', options:['on-duty','off-duty','on-leave','unavailable'] },
      { key:'experience', label:'Experience (years)', type:'number' }
    ],
    patients: [
      { key:'patientId', label:'Patient ID', type:'text', required:true },
      { key:'name', label:'Full Name', type:'text', required:true },
      { key:'age', label:'Age', type:'number' },
      { key:'gender', label:'Gender', type:'select', options:['male','female','other'] },
      { key:'department', label:'Department', type:'select', options: DEPARTMENTS },
      { key:'diagnosis', label:'Diagnosis', type:'text', required:true },
      { key:'severity', label:'Severity', type:'select', options:['critical','serious','moderate','mild','stable'] },
      { key:'status', label:'Status', type:'select', options:['admitted','discharged','transferred'] },
      { key:'admissionDate', label:'Admission Date', type:'date' }
    ]
  }

  return (
    <Modal
      isOpen={modal.open}
      onClose={onClose}
      title={`${modal.mode === 'create' ? 'Add' : 'Edit'} ${tab.slice(0, -1)}`}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave(form)} className="btn-primary">
            {modal.mode === 'create' ? 'Create' : 'Save Changes'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        {(fields[tab] || []).map(f => (
          <div key={f.key} className={f.type === 'text' && f.key === 'name' ? 'col-span-2' : ''}>
            <label className="label">{f.label}{f.required && <span className="text-red-400">*</span>}</label>
            {f.type === 'select' ? (
              <select className="input" value={form[f.key] || ''} onChange={update(f.key)}>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input className="input" type={f.type} value={form[f.key] || ''}
                onChange={update(f.key)} required={f.required} />
            )}
          </div>
        ))}
      </div>
    </Modal>
  )
}
