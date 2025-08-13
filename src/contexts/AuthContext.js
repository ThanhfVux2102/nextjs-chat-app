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

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('chatUser')
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          try {
            // Try to get current user data from /api/auth/me
            const currentUserData = await getCurrentUser()
            if (currentUserData && currentUserData.user) {
              // Use the fresh data from the API
              setUser(currentUserData.user)
              setIsAuthenticated(true)
              localStorage.setItem('chatUser', JSON.stringify(currentUserData.user))
            } else {
              // Fallback to checkSession
              const sessionData = await checkSession()
              if (sessionData && sessionData.user) {
                setUser(sessionData.user)
                setIsAuthenticated(true)
              } else {
                console.log('Backend session expired, clearing local auth data')
                localStorage.removeItem('chatUser')
                setUser(null)
                setIsAuthenticated(false)
              }
            }
          } catch (error) {
            console.error('getCurrentUser failed, trying checkSession:', error)
            // Fallback to checkSession
            const sessionData = await checkSession()
            if (sessionData && sessionData.user) {
              setUser(sessionData.user)
              setIsAuthenticated(true)
            } else {
              console.log('Backend session expired, clearing local auth data')
              localStorage.removeItem('chatUser')
              setUser(null)
              setIsAuthenticated(false)
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        localStorage.removeItem('chatUser')
        setUser(null)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem('chatUser', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('chatUser')
  }

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem('chatUser', JSON.stringify(updatedUser))
  }

  const refreshUserData = async () => {
    try {
      const currentUserData = await getCurrentUser()
      if (currentUserData && currentUserData.user) {
        setUser(currentUserData.user)
        localStorage.setItem('chatUser', JSON.stringify(currentUserData.user))
        return currentUserData.user
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
