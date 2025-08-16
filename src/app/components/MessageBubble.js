'use client'

export default function MessageBubble({ from, text, timestamp, isOwn, senderLabel }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginBottom: '12px'
    }}>
      <div style={{
        maxWidth: '70%',
        padding: '12px 16px',
        borderRadius: '18px',
        backgroundColor: isOwn ? '#007AFF' : '#E5E5EA',
        color: isOwn ? 'white' : 'black',
        fontSize: '14px',
        lineHeight: '1.4',
        wordWrap: 'break-word',
        position: 'relative'
      }}>
        {senderLabel && (
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            opacity: isOwn ? 0.9 : 0.7,
            marginBottom: '6px',
            textAlign: isOwn ? 'right' : 'left'
          }}>
            {senderLabel}
          </div>
        )}
        <div style={{ marginBottom: '4px' }}>
          {text}
        </div>
        {timestamp && (
          <div style={{
            fontSize: '11px',
            opacity: 0.7,
            textAlign: isOwn ? 'right' : 'left',
            marginTop: '4px'
          }}>
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  )
}
