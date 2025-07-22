// components/MessageBubble.js
export default function MessageBubble({ from, text }) {
  const isMe = from === 'me'
  return (
    <div style={{ textAlign: isMe ? 'right' : 'left', margin: '8px 0' }}>
      <span style={{
        display: 'inline-block',
        backgroundColor: isMe ? '#cfe9ba' : '#f1f0f0',
        padding: '10px 14px',
        borderRadius: '20px',
        maxWidth: '70%',
      }}>
        {text}
      </span>
    </div>
  )
}
