// src/app/components/MessageInput.js

'use client'
import { useState, useRef } from 'react'

export default function MessageInput({ onSend }) {
  const [text, setText] = useState('')
  const fileInputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (text.trim()) {
      onSend(text)
      setText('')
    }
  }

  const handleFileClick = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      console.log('Selected file:', file)
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
  
  <button
    type="button"
    onClick={handleFileClick}
    style={{
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <img
      src="/paperclip.png"
      alt="Attach"
      style={{ width: 20, height: 20, opacity: 0.6 }}
    />
  </button>

  
  <input
    type="file"
    ref={fileInputRef}
    style={{ display: 'none' }}
    onChange={handleFileChange}
  />


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
