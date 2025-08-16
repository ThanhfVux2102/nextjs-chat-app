// components/UserPanel.js
import { useAuth } from '@/contexts/AuthContext'

export default function UserPanel({ toggleRightPanel, isRightPanelOpen, isMobile }) {
  const { user: currentUser } = useAuth()

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with toggle button */}
      <div style={{
        padding: 'clamp(10px, 2.5vw, 15px) clamp(15px, 3vw, 20px)',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: 'clamp(14px, 3.5vw, 16px)' }}>
          User Details
        </div>
        {/* Toggle Button - shows appropriate icon based on panel state */}
        <button
          onClick={toggleRightPanel}
          style={{
            width: 'clamp(32px, 6vw, 36px)',
            height: 'clamp(32px, 6vw, 36px)',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#f0f0f0',
            color: '#333',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(14px, 3vw, 16px)',
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
          title={isRightPanelOpen ? 'Hide user details' : 'Show user details'}
        >
          {isRightPanelOpen ? '×' : (isMobile ? '👤' : 'ℹ️')}
        </button>
      </div>

      {/* Content */}
      <div style={{ 
        padding: 'clamp(20px, 5vw, 30px) clamp(15px, 3vw, 20px)', 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: 'clamp(15px, 3vw, 20px)'
      }}>
        {/* Default Avatar */}
        <div style={{
          width: 'clamp(80px, 15vw, 100px)',
          height: 'clamp(80px, 15vw, 100px)',
          borderRadius: '50%',
          backgroundColor: '#e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'clamp(32px, 6vw, 40px)',
          color: '#666',
          border: '3px solid #f0f0f0'
        }}>
          👤
        </div>

        {/* User Name */}
        <div style={{
          textAlign: 'center'
        }}>
          <h3 style={{
            margin: '0 0 5px 0',
            fontSize: 'clamp(16px, 4vw, 20px)',
            fontWeight: '600',
            color: '#333'
          }}>
            {currentUser?.username || currentUser?.name || 'User'}
          </h3>
        </div>

        {/* User Email */}
        <div style={{
          textAlign: 'center',
          padding: 'clamp(12px, 3vw, 15px)',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          width: '100%',
          maxWidth: 'clamp(200px, 50vw, 250px)'
        }}>
          <div style={{
            fontSize: 'clamp(12px, 3vw, 14px)',
            color: '#666',
            marginBottom: '5px'
          }}>
            Email
          </div>
          <div style={{
            fontSize: '14px',
            color: '#333',
            fontWeight: '500',
            wordBreak: 'break-word'
          }}>
            {currentUser?.email || 'No email available'}
          </div>
        </div>
      </div>
    </div>
  )
}
