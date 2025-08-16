'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { checkSession, getCurrentUser } from '@/lib/api'
import websocketService from '@/lib/websocket'

const AuthContext = createContext()

function normalizeUser(user) {
  if (!user || typeof user !== 'object') return user
  const id = user.id ?? user.user_id ?? user._id ?? null
  if (id == null) return user
  return { ...user, id }
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check for existing session on mount and keep across reloads/tabs
  useEffect(() => {
    let cancelled = false

    const hydrateFromLocalStorage = () => {
      try {
        const saved = localStorage.getItem('chatUser')
        if (saved) {
          const parsed = JSON.parse(saved)
          const normalized = normalizeUser(parsed)
          setUser(normalized)
          setIsAuthenticated(true)
          // Allow app to render immediately with local session
          setLoading(false)
          return true
        }
      } catch { }
      return false
    }

    const validateWithBackend = async () => {
      try {
        // Prefer a fresh user object from the backend if cookie/session exists
        const currentUserData = await getCurrentUser()
        if (!cancelled && currentUserData) {
          // Handle both nested (legacy) and flat response structures
          const userData = currentUserData.user || (currentUserData.user_id ? currentUserData : null)
          if (userData) {
            const normalized = normalizeUser(userData)
            setUser(normalized)
            setIsAuthenticated(true)
            localStorage.setItem('chatUser', JSON.stringify(normalized))
            if (!cancelled) setLoading(false)
            return
          }
        }
      } catch (err) {
        console.warn('getCurrentUser failed, falling back to checkSession:', err?.message)
      }

      try {
        const sessionData = await checkSession()
        if (!cancelled && sessionData && sessionData.user) {
          const normalized = normalizeUser(sessionData.user)
          setUser(normalized)
          setIsAuthenticated(true)
          localStorage.setItem('chatUser', JSON.stringify(normalized))
          if (!cancelled) setLoading(false)
        } else if (!cancelled) {
          // Do NOT force logout; keep local session so user stays signed in across reloads
          setLoading(false)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error validating session:', error)
          // Keep local session on errors
          setIsAuthenticated(!!localStorage.getItem('chatUser'))
          setUser(prev => prev)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const hadLocal = hydrateFromLocalStorage()
    // Validate silently in background; do not disrupt local session on failure
    validateWithBackend()

    // Sync auth state across tabs
    const onStorage = (e) => {
      if (e.key === 'chatUser') {
        try {
          if (e.newValue) {
            const parsed = JSON.parse(e.newValue)
            const normalized = normalizeUser(parsed)
            setUser(normalized)
            setIsAuthenticated(true)
          } else {
            setUser(null)
            setIsAuthenticated(false)
          }
        } catch { }
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      cancelled = true
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const login = async (userData) => {
    // Ensure we immediately have a normalized id for downstream consumers
    const initial = userData?.user || userData
    const normalizedInitial = normalizeUser(initial)
    setUser(normalizedInitial)
    setIsAuthenticated(true)
    localStorage.setItem('chatUser', JSON.stringify(normalizedInitial))
    // Immediately refresh from backend to get canonical id (e.g., ObjectId)
    try {
      const currentUserData = await getCurrentUser()
      if (currentUserData) {
        // Handle both nested (legacy) and flat response structures
        const refreshedUserData = currentUserData.user || (currentUserData.user_id ? currentUserData : null)
        if (refreshedUserData) {
          const normalizedRefreshed = normalizeUser(refreshedUserData)
          setUser(normalizedRefreshed)
          localStorage.setItem('chatUser', JSON.stringify(normalizedRefreshed))
        }
      }
    } catch { }
  }

  const logout = () => {
    try {
      websocketService.disconnect()
    } catch { }
    setUser(null)
    setIsAuthenticated(false)
    try {
      // Only clear this app's keys to avoid wiping other origins' data
      localStorage.removeItem('chatUser')
    } catch (error) {
      console.warn('Failed to clear localStorage on logout:', error)
    }
  }

  const updateUser = (updates) => {
    const updatedUser = normalizeUser({ ...user, ...updates })
    setUser(updatedUser)
    localStorage.setItem('chatUser', JSON.stringify(updatedUser))
  }

  const refreshUserData = async () => {
    try {
      const currentUserData = await getCurrentUser()
      if (currentUserData) {
        // Handle both nested (legacy) and flat response structures
        const userData = currentUserData.user || (currentUserData.user_id ? currentUserData : null)
        if (userData) {
          const normalized = normalizeUser(userData)
          setUser(normalized)
          localStorage.setItem('chatUser', JSON.stringify(normalized))
          return userData
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    }
    return null
  }

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    refreshUserData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
