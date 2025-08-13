// components/UserPanel.js
import { useAuth } from '@/contexts/AuthContext'

export default function UserPanel({ toggleRightPanel, isRightPanelOpen }) {
  const { user: currentUser } = useAuth()

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with user info and toggle button */}
      <div style={{
        padding: '15px 20px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {currentUser?.username || currentUser?.name || 'User'}
          </div>
          <div style={{ fontSize: '12px', color: '#4CAF50' }}>
            ● Online
          </div>
        </div>
        {/* Toggle Right Panel Button */}
        <button
          onClick={toggleRightPanel}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#f0f0f0',
            color: '#333',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
          title={isRightPanelOpen ? 'Hide details' : 'Show details'}
        >
          i
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px', flex: 1 }}>
        <img 
          src={currentUser?.avatar || '/default-avatar.svg'} 
          style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} 
          alt={currentUser?.username || currentUser?.name || 'User'}
        />
        <h3>{currentUser?.username || currentUser?.name || 'User'}</h3>
        <p style={{ color: 'green' }}>● Online</p>
        <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
          {currentUser?.email || 'No email available'}
        </p>
      </div>
    </div>
  )
}
