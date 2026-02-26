import axios from 'axios'
import { authStorage } from '@/lib/storage'

export const api = axios.create({
  // Prefer explicit env base URL; otherwise use Vite dev proxy / same-origin paths.
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
})

api.interceptors.request.use((config) => {
  const token = authStorage.getToken()
  config.headers = config.headers || {}
  const requestUrl = config.url || ''
  const isAuthLoginOrSignup =
    requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/signup')
  if (token && !isAuthLoginOrSignup) {
    config.headers.Authorization = `Bearer ${token}`
  } else if (isAuthLoginOrSignup && 'Authorization' in config.headers) {
    delete config.headers.Authorization
  }
  return config
})

let onUnauthorizedHandler = null
export function setUnauthorizedHandler(handler) {
  onUnauthorizedHandler = handler
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const requestUrl = error?.config?.url || ''
    const isAuthEndpoint = requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/signup')
    if (status === 401 && onUnauthorizedHandler && authStorage.getToken() && !isAuthEndpoint) {
      onUnauthorizedHandler()
    }
    return Promise.reject(error)
  }
)

export function unwrap(response) {
  return response.data?.data
}
