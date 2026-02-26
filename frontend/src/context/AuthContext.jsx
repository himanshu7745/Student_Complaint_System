import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { authApi } from '@/api/auth'
import { setUnauthorizedHandler } from '@/api/client'
import { authStorage } from '@/lib/storage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authStorage.getUser())
  const [token, setToken] = useState(() => authStorage.getToken())
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(authStorage.getToken()))
  const skipNextTokenValidationRef = useRef(false)

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout()
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  useEffect(() => {
    if (!token) {
      setIsBootstrapping(false)
      return
    }

    if (skipNextTokenValidationRef.current) {
      skipNextTokenValidationRef.current = false
      setIsBootstrapping(false)
      return
    }

    let active = true
    authApi
      .me()
      .then((me) => {
        if (!active) return
        setUser(me)
        authStorage.setUser(me)
      })
      .catch(() => {
        if (!active) return
        logout()
      })
      .finally(() => {
        if (active) setIsBootstrapping(false)
      })
    return () => {
      active = false
    }
  }, [token])

  function setSession(authResponse) {
    if (!authResponse?.accessToken || !authResponse?.user) {
      throw new Error('Invalid authentication response')
    }
    authStorage.setToken(authResponse.accessToken)
    authStorage.setUser(authResponse.user)
    skipNextTokenValidationRef.current = true
    setToken(authResponse.accessToken)
    setUser(authResponse.user)
    setIsBootstrapping(false)
  }

  async function login(payload) {
    const response = await authApi.login(payload)
    setSession(response)
    return response
  }

  async function signup(payload) {
    const response = await authApi.signup(payload)
    setSession(response)
    return response
  }

  function logout() {
    authStorage.clear()
    setUser(null)
    setToken(null)
    setIsBootstrapping(false)
  }

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isBootstrapping,
    login,
    signup,
    logout,
  }), [user, token, isBootstrapping])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
