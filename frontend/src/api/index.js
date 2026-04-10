// ============================================================
// api/index.js - Centralized API client (Axios)
// ============================================================

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

// ── Axios instance ─────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// ── Request interceptor: attach JWT ───────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, err => Promise.reject(err))

// ── Response interceptor: handle 401 ─────────────────────
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ───────────────────────────────────────────────────
export const authAPI = {
  login:    data => api.post('/auth/login', data),
  register: data => api.post('/auth/register', data),
  me:       ()   => api.get('/auth/me')
}

// ── Dashboard ──────────────────────────────────────────────
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview')
}

// ── Beds ───────────────────────────────────────────────────
export const bedsAPI = {
  getAll:   params => api.get('/beds', { params }),
  getStats: ()     => api.get('/beds/stats'),
  getById:  id     => api.get(`/beds/${id}`),
  create:   data   => api.post('/beds', data),
  update:   (id, data) => api.put(`/beds/${id}`, data),
  delete:   id     => api.delete(`/beds/${id}`)
}

// ── Equipment ──────────────────────────────────────────────
export const equipmentAPI = {
  getAll:   params => api.get('/equipment', { params }),
  getStats: ()     => api.get('/equipment/stats'),
  getById:  id     => api.get(`/equipment/${id}`),
  create:   data   => api.post('/equipment', data),
  update:   (id, data) => api.put(`/equipment/${id}`, data),
  delete:   id     => api.delete(`/equipment/${id}`)
}

// ── Staff ──────────────────────────────────────────────────
export const staffAPI = {
  getAll:   params => api.get('/staff', { params }),
  getStats: ()     => api.get('/staff/stats'),
  getById:  id     => api.get(`/staff/${id}`),
  create:   data   => api.post('/staff', data),
  update:   (id, data) => api.put(`/staff/${id}`, data),
  delete:   id     => api.delete(`/staff/${id}`)
}

// ── Patients ───────────────────────────────────────────────
export const patientsAPI = {
  getAll:   params => api.get('/patients', { params }),
  getStats: ()     => api.get('/patients/stats'),
  getById:  id     => api.get(`/patients/${id}`),
  create:   data   => api.post('/patients', data),
  update:   (id, data) => api.put(`/patients/${id}`, data),
  delete:   id     => api.delete(`/patients/${id}`)
}

// ── Predictions ────────────────────────────────────────────
export const predictionsAPI = {
  getBeds:            params => api.get('/predictions/beds', { params }),
  getEquipment:       params => api.get('/predictions/equipment', { params }),
  getStaff:           ()     => api.get('/predictions/staff'),
  getRecommendations: ()     => api.get('/predictions/recommendations')
}

// ── Alerts ─────────────────────────────────────────────────
export const alertsAPI = {
  getAll:       params => api.get('/alerts', { params }),
  create:       data   => api.post('/alerts', data),
  markRead:     id     => api.put(`/alerts/${id}/read`),
  resolve:      id     => api.put(`/alerts/${id}/resolve`),
  markAllRead:  ()     => api.put('/alerts/mark-all-read')
}

// ── Reports ────────────────────────────────────────────────
export const reportsAPI = {
  downloadPDF:       () => `${BASE_URL}/reports/pdf`,
  downloadCSV:       (type, dept) => `${BASE_URL}/reports/csv?type=${type}${dept ? `&dept=${dept}` : ''}`,
  getSummary:        () => api.get('/reports/summary'),
  getDepartments:    () => api.get('/reports/departments'),
  getDepartmentDetail: dept => api.get(`/reports/department/${dept}`)
}

export default api
