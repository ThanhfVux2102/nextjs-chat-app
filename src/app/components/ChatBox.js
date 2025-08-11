'use client'

import { useChat } from '@/contexts/ChatContext'
import { useAuth } from '@/contexts/AuthContext'
import MessageInput from './MessageInput'
import MessageBubble from './MessageBubble'
import { useEffect, useRef } from 'react'

export default function ChatBox() {
  const { currentChat, getMessagesForUser, addMessage, loading } = useChat()
  const { user: currentUser } = useAuth()
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentChat])

  const handleSend = (text) => {
    if (!currentChat) {
      alert('Please select a chat to send message')
      return
    }

    if (!currentUser) {
      alert('Please login to send messages')
      return
    }

    const newMessage = {
      from: currentUser.id,
      text: text,
      timestamp: new Date().toISOString(),
      chat_id: currentChat.chat_id || currentChat.id
    }

    addMessage(newMessage)
  }

  const messages = currentChat ? getMessagesForUser(currentChat.chat_id || currentChat.id) : []

  if (!currentChat) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#666'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>
          👋 Welcome to F.E Chat!
        </div>
        <div style={{ fontSize: '16px', textAlign: 'center' }}>
          Select a chat from the sidebar to start messaging
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat Header */}
      <div style={{
        padding: '15px 20px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <img 
          src={currentChat.avatar || '/avatars/default.jpg'} 
          style={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%',
            objectFit: 'cover'
          }} 
          alt={currentChat.name || currentChat.username}
        />
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {currentChat.name || currentChat.username}
          </div>
          <div style={{ fontSize: '12px', color: currentChat.online ? '#4CAF50' : '#666' }}>
            {currentChat.online ? '● Online' : '○ Offline'}
          </div>
        </div>
        {loading && (
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#666' }}>
            Loading...
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px',
        minHeight: 0,
        backgroundColor: '#f5f5f5'
      }}>
        {messages.length > 0 ? (
          messages.map((msg, i) => (
            <MessageBubble 
              key={msg.id || i} 
              from={msg.from} 
              text={msg.text}
              timestamp={msg.timestamp}
              isOwn={msg.from === currentUser?.id}
            />
          ))
        ) : (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            marginTop: '50px',
            fontSize: '14px'
          }}>
            {loading ? 'Loading messages...' : 'No messages yet. Start the conversation!'}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput onSend={handleSend} />
    </div>
  )
}
