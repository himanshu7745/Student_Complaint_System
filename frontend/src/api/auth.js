import { api, unwrap } from './client'

export const authApi = {
  signup(payload) {
    return api.post('/api/auth/signup', payload).then(unwrap)
  },
  login(payload) {
    return api.post('/api/auth/login', payload).then(unwrap)
  },
  me() {
    return api.get('/api/auth/me').then(unwrap)
  },
}
