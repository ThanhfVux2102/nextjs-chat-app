'use client'

import Sidebar from '../components/Sidebar'
import ChatBox from '../components/ChatBox'
import UserPanel from '../components/UserPanel'

export default function ChatPage() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        fontFamily: 'sans-serif',
        backgroundColor: '#fff',
        color: '#000',
      }}
    >
      <div style={{ flex: 2, borderRight: '1px solid #ddd' }}>
        <Sidebar />
      </div>

      {/* 🧩 Quan trọng: thêm flex và column cho phần giữa */}
     
      <div style={{ flex: 5, display: 'flex', flexDirection: 'column', borderRight: '1px solid #ddd' }}>
        <ChatBox />
      </div>

      <div style={{ flex: 3 }}>
        <UserPanel />
      </div>
    </div>
  )
}
