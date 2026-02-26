import { httpRequest } from '@/api/http'

export async function loginApi(email, password) {
  return httpRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export async function meApi() {
  return httpRequest('/api/auth/me')
}
