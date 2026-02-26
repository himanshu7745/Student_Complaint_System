import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loginApi, meApi } from '@/api/auth'
import { clearStoredSession, getStoredSession, onUnauthorized, setStoredSession } from '@/auth/session'

const AuthContext = createContext(null)

function mapProfileUser(user) {
  if (!user) return null
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession())
  const [bootLoading, setBootLoading] = useState(true)

  const logout = useCallback(() => {
    clearStoredSession()
    setSession(null)
  }, [])

  useEffect(() => {
    let mounted = true
    const existing = getStoredSession()
    if (!existing?.accessToken) {
      setBootLoading(false)
      return undefined
    }

    meApi()
      .then((profile) => {
        if (!mounted) return
        const next = {
          ...existing,
          user: mapProfileUser(profile),
        }
        setStoredSession(next)
        setSession(next)
      })
      .catch(() => {
        if (!mounted) return
        logout()
      })
      .finally(() => {
        if (mounted) setBootLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [logout])

  useEffect(() => onUnauthorized(() => logout()), [logout])

  const login = useCallback(async (email, password) => {
    const response = await loginApi(email, password)
    const next = {
      accessToken: response.accessToken,
      tokenType: response.tokenType || 'Bearer',
      expiresAt: response.expiresAt,
      user: mapProfileUser(response.user),
    }
    setStoredSession(next)
    setSession(next)
    return next
  }, [])

  const value = useMemo(() => {
    const user = session?.user || null
    const role = user?.role || null
    const isAuthenticated = Boolean(session?.accessToken && user)
    const isAdmin = ['ROLE_REVIEWER', 'ROLE_RESOLVER', 'ROLE_DEPT_ADMIN', 'ROLE_SUPER_ADMIN'].includes(role)
    return {
      bootLoading,
      session,
      token: session?.accessToken || null,
      user,
      role,
      isAuthenticated,
      isAdmin,
      login,
      logout,
      hasAnyRole: (...roles) => roles.includes(role),
    }
  }, [bootLoading, session, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
