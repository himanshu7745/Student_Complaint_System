const STORAGE_KEY = 'complaints_auth_session_v1'
const UNAUTHORIZED_EVENT = 'auth:unauthorized'

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setStoredSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getAccessToken() {
  return getStoredSession()?.accessToken || null
}

export function emitUnauthorized() {
  window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT))
}

export function onUnauthorized(handler) {
  window.addEventListener(UNAUTHORIZED_EVENT, handler)
  return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler)
}
