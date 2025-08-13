'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '../components/Sidebar'
import ChatBox from '../components/ChatBox'
import UserPanel from '../components/UserPanel'

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <div
        style={{
          display: 'flex',
          height: '100vh',
          fontFamily: 'sans-serif',
          backgroundColor: '#fff',
          color: '#000',
        }}
      >
       
        <div style={{ 
          flex: 2, 
          borderRight: '1px solid #ddd',
          backgroundColor: '#fff',
          minWidth: '280px'
        }}>
          <Sidebar />
        </div>
        <div style={{ 
          flex: 5, 
          display: 'flex', 
          flexDirection: 'column', 
          borderRight: '1px solid #ddd',
          backgroundColor: '#f8f9fa'
        }}>
          <ChatBox />
        </div>
        <div style={{ 
          flex: 3,
          backgroundColor: '#fff',
          minWidth: '300px'
        }}>
          <UserPanel />
        </div>
      </div>
    </ProtectedRoute>
  )
}
