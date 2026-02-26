import { api, unwrap } from './client'

export const studentComplaintsApi = {
  dashboardKpis() {
    return api.get('/api/student/dashboard/kpis').then(unwrap)
  },
  list(params) {
    return api.get('/api/student/complaints', { params }).then(unwrap)
  },
  get(id) {
    return api.get(`/api/student/complaints/${id}`).then(unwrap)
  },
  create(payload) {
    return api.post('/api/student/complaints', payload).then(unwrap)
  },
  markResolved(id, payload = {}) {
    return api.post(`/api/student/complaints/${id}/resolve`, payload).then(unwrap)
  },
  escalate(id, payload = {}) {
    return api.post(`/api/student/complaints/${id}/escalate`, payload).then(unwrap)
  },
}

export const adminComplaintsApi = {
  dashboardKpis() {
    return api.get('/api/admin/dashboard/kpis').then(unwrap)
  },
  list(params) {
    return api.get('/api/admin/complaints', { params }).then(unwrap)
  },
  get(id) {
    return api.get(`/api/admin/complaints/${id}`).then(unwrap)
  },
  assignDepartment(id, payload) {
    return api.post(`/api/admin/complaints/${id}/assign-department`, payload).then(unwrap)
  },
  overrideAi(id, payload) {
    return api.post(`/api/admin/complaints/${id}/override-ai`, payload).then(unwrap)
  },
  resendEmail(id) {
    return api.post(`/api/admin/complaints/${id}/resend-email`).then(unwrap)
  },
  acknowledgeManual(id, payload = {}) {
    return api.post(`/api/admin/complaints/${id}/acknowledge-manual`, payload).then(unwrap)
  },
  markActionTaken(id, payload) {
    return api.post(`/api/admin/complaints/${id}/action-taken`, payload).then(unwrap)
  },
  addInternalNote(id, payload) {
    return api.post(`/api/admin/complaints/${id}/internal-note`, payload).then(unwrap)
  },
  overdueList() {
    return api.get('/api/admin/complaints/overdue').then(unwrap)
  },
}
