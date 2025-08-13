// components/UserPanel.js
export default function UserPanel({ toggleRightPanel, isRightPanelOpen }) {
  const media = [
    '/media/img1.jpg', '/media/img2.jpg', '/media/img3.jpg', '/media/img4.jpg'
  ]

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
            Esther Howard
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
        <img src="/avatars/esther.jpg" style={{ width: 80, height: 80, borderRadius: '50%' }} />
        <h3>Esther Howard</h3>
        <p style={{ color: 'green' }}>● Online</p>

        <div style={{ marginTop: 30 }}>
          <h4>Media</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {media.map((m, i) => (
              <img key={i} src={m} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
