// components/UserPanel.js
export default function UserPanel() {
  const media = [
    '/media/img1.jpg', '/media/img2.jpg', '/media/img3.jpg', '/media/img4.jpg'
  ]

  return (
    <div style={{ padding: '20px' }}>
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
  )
}
