// src/app/components/MessageInput.js

'use client'
import { useState } from 'react'

export default function MessageInput({ onSend }) {
  const [text, setText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (text.trim()) {
      onSend(text)
      setText('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 16px',
        borderTop: '1px solid #ccc',
        backgroundColor: '#fff',
        gap: '10px',
      }}
    >
      <div style={{ flex: 1 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '20px',
            border: '1px solid #ccc',
            color: '#000',
            backgroundColor: '#fff',
            outline: 'none',
          }}
        />
      </div>
    </form>

  )
}
