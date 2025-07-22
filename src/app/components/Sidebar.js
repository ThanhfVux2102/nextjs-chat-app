// components/Sidebar.js

//import Sidebar from '../../components/Sidebar'
import ChatBox from './ChatBox'
import UserPanel from './UserPanel'

export default function Sidebar() {
  const users = [
    { name: 'Esther Howard', avatar: '/avatars/esther.jpg', last: 'Perfect!', online: true },
    { name: 'Kristin Watson', avatar: '/avatars/kristin.jpg', last: "Haha that's terrifying 😂", online: false },
  ]

  return (
    <div style={{ padding: '10px' }}>
      <h3 style={{ fontSize: '30px', fontStyle: 'Bold'}}>Messages</h3>
      <input
  type="text"
  placeholder="Search..."
  style={{
    width: '100%',
    padding: '8px 12px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '20px',
    outline: 'none',
    backgroundColor: '#fff',
    color: '#000',
  }}
/>
      {users.map((user, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 5px', alignItems: 'center', cursor: 'pointer' }}>
          <img src={user.avatar} style={{ width: 40, height: 40, borderRadius: '50%' }} />
          <div>
            <strong>{user.name}</strong><br />
            <small>{user.last}</small>
          </div>
          {user.online && <div style={{ width: 8, height: 8, backgroundColor: 'green', borderRadius: '50%', marginLeft: 'auto' }} />}
        </div>
      ))}
    </div>
  )
}
