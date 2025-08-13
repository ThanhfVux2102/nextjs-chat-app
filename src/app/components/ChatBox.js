'use client'

import { useChat } from '@/contexts/ChatContext'
import { useAuth } from '@/contexts/AuthContext'
import MessageInput from './MessageInput'
import MessageBubble from './MessageBubble'
import { useEffect, useRef } from 'react'

export default function ChatBox({ toggleRightPanel, isRightPanelOpen }) {
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
  console.log('🔍 ChatBox Debug:')
  console.log('- Current Chat ID:', currentChat?.chat_id || currentChat?.id)
  console.log('- Current User ID:', currentUser?.id)
  console.log('- All Messages:', messages)
  console.log('- Messages Count:', messages.length)
  console.log('- Messages Details:', messages.map(msg => ({
    id: msg.id,
    from: msg.from,
    text: msg.text,
    chat_id: msg.chat_id
  })))

  if (!currentChat) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#666',
        position: 'relative'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>
          👋 Welcome to F.E Chat!
        </div>
        <div style={{ fontSize: '16px', textAlign: 'center' }}>
          Select a chat from the sidebar to start messaging
        </div>
        
        {/* Toggle Right Panel Button - only show when panel is closed */}
        {!isRightPanelOpen && (
          <button
            onClick={toggleRightPanel}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
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
            title="Show details"
          >
            i
          </button>
        )}
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
          src={currentChat.avatar || '/default-avatar.svg'} 
          style={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%',
            objectFit: 'cover'
          }} 
          alt={currentChat.name || currentChat.username}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {currentChat.name || currentChat.username}
          </div>
          <div style={{ fontSize: '12px', color: currentChat.online ? '#4CAF50' : '#666' }}>
            {currentChat.online ? '● Online' : '○ Offline'}
          </div>
        </div>
        {loading && (
          <div style={{ fontSize: '12px', color: '#666', marginRight: 10 }}>
            Loading...
          </div>
        )}
        {/* Toggle Right Panel Button - only show when panel is closed */}
        {!isRightPanelOpen && (
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
            title="Show details"
          >
            i
          </button>
        )}
      </div>
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px',
        minHeight: 0,
        backgroundColor: '#f5f5f5'
      }}>
        {messages.length > 0 ? (
          (() => {
            console.log('🔍 Rendering messages:', messages.length, 'messages');
            console.log('🔍 Messages array:', messages);
            
            return messages.map((msg, i) => {
              const msgFromStr = String(msg.from);
              const currentUserIdStr = String(currentUser?.id);
              const isOwn = msgFromStr === currentUserIdStr;
              
              console.log('🔍 MessageBubble Debug:', {
                messageId: msg.id,
                msgFrom: msg.from,
                msgFromType: typeof msg.from,
                msgFromStr: msgFromStr,
                currentUserId: currentUser?.id,
                currentUserIdType: typeof currentUser?.id,
                currentUserIdStr: currentUserIdStr,
                isOwn: isOwn,
                text: msg.text
              });
              
              return (
                <MessageBubble 
                  key={msg.id || i} 
                  from={msg.from} 
                  text={msg.text}
                  timestamp={msg.timestamp}
                  isOwn={isOwn}
                />
              );
            });
          })()
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
      <MessageInput onSend={handleSend} />
    </div>
  )
}
