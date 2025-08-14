'use client'

import { AuthProvider } from './AuthContext'
import { ChatProvider } from './ChatContext'

export function AppProvider({ children }) {
  return (
    <AuthProvider>
      <ChatProvider>
        {children}
      </ChatProvider>
    </AuthProvider>
  )
}
