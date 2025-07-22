'use client'

import { useState } from 'react'
import MessageInput from './MessageInput'
import MessageBubble from './MessageBubble'

export default function ChatBox() {
  const [messages, setMessages] = useState([
    { from: 'them', text: 'WOOHOOOO' },
    { from: 'me', text: 'Wow, this is really epic 😂😂' },
    { from: 'them', text: 'Haha oh an' },
  ])

  const handleSend = (text) => {
    setMessages([...messages, { from: 'me', text }])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', minHeight: 0 }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} from={msg.from} text={msg.text} />
        ))}
      </div>

      <MessageInput onSend={handleSend} />
    </div>
  )
}
