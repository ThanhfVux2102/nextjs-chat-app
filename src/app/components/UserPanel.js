// components/UserPanel.js
import { useAuth } from '@/contexts/AuthContext'

export default function UserPanel({ toggleRightPanel, isRightPanelOpen }) {
  const { user: currentUser } = useAuth()

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with toggle button */}
      <div style={{
        padding: '15px 20px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
          User Details
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
      <div style={{ 
        padding: '30px 20px', 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Default Avatar */}
        <div style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          backgroundColor: '#e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
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
            fontSize: '20px',
            fontWeight: '600',
            color: '#333'
          }}>
            {currentUser?.username || currentUser?.name || 'User'}
          </h3>
        </div>

        {/* User Email */}
        <div style={{
          textAlign: 'center',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '250px'
        }}>
          <div style={{
            fontSize: '14px',
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
