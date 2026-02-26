import { api, unwrap } from './client'

export const departmentsApi = {
  list() {
    return api.get('/api/admin/departments').then(unwrap)
  },
  create(payload) {
    return api.post('/api/admin/departments', payload).then(unwrap)
  },
  update(id, payload) {
    return api.put(`/api/admin/departments/${id}`, payload).then(unwrap)
  },
  remove(id) {
    return api.delete(`/api/admin/departments/${id}`).then(unwrap)
  },
}
