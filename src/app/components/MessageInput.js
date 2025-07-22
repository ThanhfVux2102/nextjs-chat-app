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
      {/* Nút icon đính kèm */}
      <button
        type="button"
        onClick={handleFileClick}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
        }}
      >
        <img
          src="/paperclip.png"
          alt="Attach"
          style={{ width: 20, height: 20, opacity: 0.6 }}
        />
      </button>

      {/* File input ẩn */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Input nhập tin nhắn */}
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

      {/* Nút gửi */}
      <button
        type="submit"
        style={{
          padding: '8px 16px',
          borderRadius: '20px',
          backgroundColor: '#444',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        Send
      </button>
    </form>
  )
}
