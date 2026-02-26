import { emitUnauthorized, getAccessToken } from '@/auth/session'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

export class HttpError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.payload = payload
  }
}

function buildUrl(path, query) {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE_URL}${path}`)
  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value == null || value === '' || value === 'All') return
      if (Array.isArray(value)) {
        value.filter((v) => v != null && v !== '' && v !== 'All').forEach((v) => url.searchParams.append(key, v))
      } else {
        url.searchParams.set(key, String(value))
      }
    })
  }
  return url.toString()
}

function parseErrorMessage(payload, fallback = 'Request failed') {
  if (!payload) return fallback
  if (typeof payload === 'string') return payload
  if (payload.message) return payload.message
  if (payload.error) return payload.error
  if (Array.isArray(payload.errors) && payload.errors[0]?.message) return payload.errors[0].message
  if (Array.isArray(payload.fieldViolations) && payload.fieldViolations[0]?.message) return payload.fieldViolations[0].message
  return fallback
}

export async function httpRequest(path, options = {}) {
  const {
    method = 'GET',
    query,
    headers,
    body,
    formData,
    signal,
    raw = false,
  } = options

  const token = getAccessToken()
  const finalHeaders = new Headers(headers || {})
  if (token) finalHeaders.set('Authorization', `Bearer ${token}`)
  if (!formData && body != null && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json')
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers: finalHeaders,
    body: formData || (body != null ? JSON.stringify(body) : undefined),
    signal,
  })

  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null)

  if (!res.ok) {
    const message = parseErrorMessage(payload, `HTTP ${res.status}`)
    if (res.status === 401) emitUnauthorized()
    throw new HttpError(message, res.status, payload)
  }

  if (raw) return payload
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data
  return payload
}

export function isHttpError(error) {
  return error instanceof HttpError
}

export function getApiBaseUrl() {
  return API_BASE_URL
}
