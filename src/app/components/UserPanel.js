'use client'

import { useChat } from '@/contexts/ChatContext'
import { useAuth } from '@/contexts/AuthContext'

export default function UserPanel() {
  const { currentChat } = useChat()
  const { user: currentUser, logout } = useAuth()

  const media = [
    '/media/img1.jpg', '/media/img2.jpg', '/media/img3.jpg', '/media/img4.jpg'
  ]

  if (!currentChat) {
    return (
      <div style={{ 
        padding: '20px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#666'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>
          👤 Chat Profile
        </div>
        <div style={{ fontSize: '14px', textAlign: 'center' }}>
          Select a chat from the sidebar to view details
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Selected Chat Profile */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <img 
          src={currentChat.avatar || '/avatars/default.jpg'} 
          style={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%',
            objectFit: 'cover',
            marginBottom: '15px'
          }} 
          alt={currentChat.name || currentChat.username}
        />
        <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>
          {currentChat.name || currentChat.username}
        </h3>
        <p style={{ 
          color: currentChat.online ? '#4CAF50' : '#666',
          margin: '0 0 15px 0',
          fontSize: '14px'
        }}>
          {currentChat.online ? '● Online' : '○ Offline'}
        </p>
        <p style={{ 
          color: '#666', 
          fontSize: '12px',
          margin: '0'
        }}>
          {currentChat.email || 'No email available'}
        </p>
        {currentChat.chat_id && (
          <p style={{ 
            color: '#999', 
            fontSize: '10px',
            margin: '5px 0 0 0',
            fontFamily: 'monospace'
          }}>
            Chat ID: {currentChat.chat_id}
          </p>
        )}
      </div>

      {/* Media Section */}
      <div style={{ marginTop: 'auto' }}>
        <h4 style={{ marginBottom: '15px', fontSize: '16px' }}>Shared Media</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {media.map((m, i) => (
            <img 
              key={i} 
              src={m} 
              style={{ 
                width: 60, 
                height: 60, 
                borderRadius: '8px', 
                objectFit: 'cover',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              alt={`Media ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Current User Info */}
      {currentUser && (
        <div style={{ 
          marginTop: '30px',
          padding: '15px',
          borderTop: '1px solid #eee',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <img 
              src={currentUser.avatar || '/avatars/default.jpg'} 
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%',
                objectFit: 'cover'
              }} 
              alt="Current user"
            />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
            {currentUser.username}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
            {currentUser.email}
          </div>
          <button
            onClick={logout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
