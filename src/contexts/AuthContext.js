'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { checkSession, getCurrentUser } from '@/lib/api'

const AuthContext = createContext()

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
          setUser(parsed)
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
            setUser(userData)
            setIsAuthenticated(true)
            localStorage.setItem('chatUser', JSON.stringify(userData))
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
          setUser(sessionData.user)
          setIsAuthenticated(true)
          localStorage.setItem('chatUser', JSON.stringify(sessionData.user))
          if (!cancelled) setLoading(false)
        } else if (!cancelled) {
          // Do NOT force logout; keep local session so user stays signed in across reloads
          console.info('No backend session, keeping local session')
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
            setUser(parsed)
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
    // Optimistically set
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem('chatUser', JSON.stringify(userData))
    // Immediately refresh from backend to get canonical id (e.g., ObjectId)
    try {
      const currentUserData = await getCurrentUser()
      if (currentUserData) {
        // Handle both nested (legacy) and flat response structures
        const refreshedUserData = currentUserData.user || (currentUserData.user_id ? currentUserData : null)
        if (refreshedUserData) {
          setUser(refreshedUserData)
          localStorage.setItem('chatUser', JSON.stringify(refreshedUserData))
        }
      }
    } catch { }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('chatUser')

    // Clear all chat-related localStorage data
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('chatMessages_')) {
          localStorage.removeItem(key)
        }
      })
      console.log('🗑️ Cleared all persisted chat messages on logout')
    } catch (error) {
      console.warn('Failed to clear persisted messages on logout:', error)
    }
  }

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates }
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
          setUser(userData)
          localStorage.setItem('chatUser', JSON.stringify(userData))
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
