'use client'

import { useChat } from '@/contexts/ChatContext'
import { useAuth } from '@/contexts/AuthContext'
import MessageInput from './MessageInput'
import MessageBubble from './MessageBubble'
import { useEffect, useRef, useCallback } from 'react'

export default function ChatBox({ toggleRightPanel, isRightPanelOpen, isMobile }) {
  const { currentChat, getMessagesForUser, addMessage, loading, loadMoreMessages, isMessageFromCurrentUser, displayName, getDisplayForUser } = useChat()
  const { user: currentUser } = useAuth()
  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [currentChat])

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container || !currentChat) return
    if (container.scrollTop <= 0) {
      // Load 50 more older messages
      loadMoreMessages(currentChat.chat_id || currentChat.id, 50)
    }
  }, [currentChat, loadMoreMessages])

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

  // Compute a human-friendly sender label for each message
  const getSenderLabel = (msg, isOwn) => {
    if (isOwn) return 'You'

    // Prefer explicit sender fields on the message
    const fromMsg = msg.sender_username || msg.sender_name || msg.username || msg.name || msg.sender_email || msg.email
    if (fromMsg) return fromMsg

    // Derive sender id from various possible fields
    const senderId = (
      msg.from ??
      msg.sender_id ??
      msg.user_id ??
      msg.senderId ??
      msg.userId ??
      msg.sender ??
      msg.author_id ??
      msg.authorId ??
      null
    )

    // Try resolving via context members cache (group chats)
    const resolved = getDisplayForUser?.(senderId, currentChat?.chat_id || currentChat?.id)
    if (resolved) return resolved

    // Detect if group chat (participants > 2)
    const isGroup = Array.isArray(currentChat?.participants) && currentChat.participants.length > 2

    if (isGroup) {
      // Fallback to a short ID label for groups if we don't know the username
      const shortId = String(senderId ?? '').slice(-4)
      return shortId ? `User ${shortId}` : 'Member'
    }

    // Personal chat: use the counterpart info or displayName helper
    const counterpart = currentChat?.other_user_username || currentChat?.username || currentChat?.other_user_email || currentChat?.email
    if (counterpart) return counterpart

    try {
      if (typeof displayName === 'function') return displayName(currentChat)
    } catch (_) { }
    return 'Unknown'
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
        color: '#666',
        position: 'relative'
      }}>
        <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', marginBottom: '10px', textAlign: 'center' }}>
          👋 Welcome to F.E Chat!
        </div>
        <div style={{ fontSize: 'clamp(14px, 3vw, 16px)', textAlign: 'center', padding: '0 20px' }}>
          Select a chat from the sidebar to start messaging
        </div>


      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat Header */}
      <div style={{
        padding: 'clamp(10px, 2.5vw, 15px) clamp(15px, 3vw, 20px)',
        borderBottom: '1px solid #eee',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(8px, 2vw, 12px)'
      }}>
        <img
          src={currentChat.avatar || '/default-avatar.svg'}
          style={{
            width: 'clamp(32px, 7vw, 40px)',
            height: 'clamp(32px, 7vw, 40px)',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
          alt={currentChat.name || currentChat.username}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: 'clamp(14px, 3.5vw, 16px)' }}>
            {currentChat.name || currentChat.username}
          </div>
        </div>
        {loading && (
          <div style={{ fontSize: '12px', color: '#666', marginRight: 10 }}>
            Loading...
          </div>
        )}

      </div>
      <div ref={scrollContainerRef} onScroll={handleScroll} style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'clamp(15px, 3vw, 20px)',
        minHeight: 0,
        backgroundColor: '#f5f5f5'
      }}>
        {messages.length > 0 ? (
          (() => {
            return messages.map((msg, i) => {
              const isOwn = isMessageFromCurrentUser?.(msg.from) ?? (String(msg.from) === String(currentUser?.id));
              const senderLabel = getSenderLabel(msg, isOwn);

              return (
                <MessageBubble
                  key={msg.id || i}
                  from={msg.from}
                  text={msg.text}
                  timestamp={msg.timestamp}
                  isOwn={isOwn}
                  senderLabel={senderLabel}
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
