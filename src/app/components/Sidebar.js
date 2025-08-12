'use client'

import { useState, useEffect } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { useAuth } from '@/contexts/AuthContext'

export default function Sidebar() {
  const { chats, searchUsers, setCurrentChatUser, loading, loadMoreChats, nextCursor, createChat, currentChat } = useChat() // Updated context destructuring
  const { user: currentUser, isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([]) // New state for search results
  const [showUserSearch, setShowUserSearch] = useState(false) // New state for toggling view
  const [searching, setSearching] = useState(false) // New state for search loading

  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (query.trim()) {
      setSearching(true)
      try {
        const results = await searchUsers(query)
        setSearchResults(results)
        setShowUserSearch(true)
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setSearching(false)
      }
    } else {
      setSearchResults([])
      setShowUserSearch(false)
    }
  }

  const handleUserClick = (chat) => {
    setCurrentChatUser(chat)
    setShowUserSearch(false)
    setSearchQuery('')
  }

  const handleCreateChat = async (user) => {
    try {
      const newChat = await createChat(user.id)
      if (newChat) {
        setCurrentChatUser(newChat)
        setShowUserSearch(false)
        setSearchQuery('')
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      alert('Failed to create chat')
    }
  }

  const displayChats = showUserSearch ? searchResults : (Array.isArray(chats) ? chats : [])

  return (
    <div style={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: '30px', fontStyle: 'Bold', marginBottom: '20px' }}>
        Messages
      </h3>
      
      {/* Simple debug button */}
      <button 
        onClick={async () => {
          try {
            const { getChatList } = await import('@/lib/api')
            console.log('Testing API call manually...')
            const result = await getChatList()
            console.log('Manual API test result:', result)
            alert(`API test: ${result.chats ? result.chats.length : 0} chats found`)
          } catch (error) {
            console.error('Manual API test error:', error)
            alert('API test failed: ' + error.message)
          }
        }}
        style={{
          marginBottom: '15px',
          padding: '8px 16px',
          backgroundColor: '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Test API
      </button>

      {/* WebSocket debug button */}
      <button 
        onClick={async () => {
          try {
            const websocketService = await import('@/lib/websocket')
            const status = websocketService.default.getConnectionStatus()
            console.log('WebSocket status:', status)
            alert(`WebSocket: ${status.isConnected ? 'Connected' : 'Disconnected'}\nReconnect attempts: ${status.reconnectAttempts}`)
          } catch (error) {
            console.error('WebSocket test error:', error)
            alert('WebSocket test failed: ' + error.message)
          }
        }}
        style={{
          marginBottom: '15px',
          marginLeft: '10px',
          padding: '8px 16px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Test WS
      </button>

      {/* Test message broadcast button */}
      <button 
        onClick={async () => {
          try {
            const websocketService = await import('@/lib/websocket')
            
            // This is a test - in real implementation you'd get these from context
            const testChatId = '6898c38b2dbf4c87dd1d1b13'
            const testUserId = 'test_user_123'
            const testMessage = 'Test broadcast message ' + new Date().toLocaleTimeString()
            
            console.log('🧪 Sending test broadcast message:', { testChatId, testUserId, testMessage })
            websocketService.default.sendNewMessage(testChatId, testUserId, testMessage)
            alert('Test message sent! Check console and other windows.')
          } catch (error) {
            console.error('Test broadcast error:', error)
            alert('Test broadcast failed: ' + error.message)
          }
        }}
        style={{
          marginBottom: '15px',
          marginLeft: '10px',
          padding: '8px 16px',
          backgroundColor: '#ff6b35',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Test Broadcast
      </button>

      {/* Test Current Chat button */}
      <button 
        onClick={async () => {
          try {
            const websocketService = await import('@/lib/websocket')
            const testMessage = `Test current chat message ${new Date().toLocaleTimeString()}`
            
            if (!currentChat?.chat_id) {
              alert('No chat selected! Please select a chat first.')
              return
            }
            
            if (!currentUser?.id) {
              alert('No user logged in!')
              return
            }
            
            console.log('🧪 Sending test to current chat:', {
              chatId: currentChat.chat_id,
              userId: currentUser.id,
              message: testMessage
            })
            
            websocketService.default.sendNewMessage(currentChat.chat_id, currentUser.id, testMessage)
          } catch (error) {
            console.error('Test current chat error:', error)
            alert('Test current chat failed: ' + error.message)
          }
        }}
        style={{
          marginBottom: '15px',
          marginLeft: '10px',
          padding: '8px 16px',
          backgroundColor: '#17a2b8',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Test Current Chat
      </button>

      {/* Simulate Backend Broadcast Test */}
      <button 
        onClick={async () => {
          try {
            const websocketService = await import('@/lib/websocket')
            
            if (!currentChat?.chat_id) {
              alert('No chat selected! Please select a chat first.')
              return
            }
            
            // Simulate what backend SHOULD send to other users
            const simulatedMessage = {
              type: "personal_message",
              data: {
                id: Date.now(),
                sender_id: "other_user_123",
                content: `Simulated broadcast message ${new Date().toLocaleTimeString()}`,
                chat_id: currentChat.chat_id,
                timestamp: new Date().toISOString()
              }
            }
            
            console.log('🧪 Simulating backend broadcast:', simulatedMessage)
            
            // Manually trigger the message handler
            const event = new MessageEvent('message', {
              data: JSON.stringify(simulatedMessage)
            })
            
            // This simulates what should happen when backend broadcasts
            websocketService.default.ws?.onmessage?.(event)
            
            alert('Simulated broadcast sent! Check if message appears in chat.')
          } catch (error) {
            console.error('Simulate broadcast error:', error)
            alert('Simulate broadcast failed: ' + error.message)
          }
        }}
        style={{
          marginBottom: '15px',
          marginLeft: '10px',
          padding: '8px 16px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Simulate Broadcast
      </button>

      {/* Test Backend Broadcasting */}
      <button 
        onClick={async () => {
          try {
            const websocketService = await import('@/lib/websocket')
            
            if (!currentChat?.chat_id) {
              alert('No chat selected! Please select a chat first.')
              return
            }
            
            // Simulate backend broadcasting to ALL users in chat
            const allInstances = websocketService.default.getAllInstances()
            const otherUsers = Array.from(allInstances.keys()).filter(id => id !== currentUser?.id)
            
            console.log('🧪 Testing backend broadcasting:')
            console.log('- Current User:', currentUser?.id)
            console.log('- Other Users:', otherUsers)
            console.log('- Chat ID:', currentChat.chat_id)
            
            // Simulate backend sending to each other user
            otherUsers.forEach(otherUserId => {
              const simulatedMessage = {
                type: "personal_message",
                data: {
                  id: Date.now() + Math.random(),
                  sender_id: currentUser?.id,
                  content: `Backend broadcast test ${new Date().toLocaleTimeString()}`,
                  chat_id: currentChat.chat_id,
                  timestamp: new Date().toISOString()
                }
              }
              
              console.log(`📤 Simulating backend sending to user ${otherUserId}:`, simulatedMessage)
              
              // Get the other user's WebSocket instance
              const otherInstance = websocketService.default.getInstance(otherUserId)
              if (otherInstance && otherInstance.ws) {
                const event = new MessageEvent('message', {
                  data: JSON.stringify(simulatedMessage)
                })
                otherInstance.ws.onmessage(event)
              }
            })
            
            alert(`Backend broadcast test sent to ${otherUsers.length} other users!`)
          } catch (error) {
            console.error('Backend broadcast test error:', error)
            alert('Backend broadcast test failed: ' + error.message)
          }
        }}
        style={{
          marginBottom: '15px',
          marginLeft: '10px',
          padding: '8px 16px',
          backgroundColor: '#fd7e14',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Test Backend Broadcast
      </button>

      {/* Test Real Backend Broadcasting */}
      <button 
        onClick={async () => {
          try {
            const websocketService = await import('@/lib/websocket')
            
            if (!currentChat?.chat_id) {
              alert('No chat selected! Please select a chat first.')
              return
            }
            
            if (!currentUser?.id) {
              alert('No user logged in!')
              return
            }
            
            console.log('🧪 Testing REAL backend broadcasting:')
            console.log('- Current User:', currentUser?.id)
            console.log('- Chat ID:', currentChat.chat_id)
            console.log('- Message: "Real backend broadcast test"')
            
            // Send a real message through WebSocket to test backend
            websocketService.default.sendNewMessage(
              currentChat.chat_id, 
              currentUser.id, 
              `Real backend broadcast test ${new Date().toLocaleTimeString()}`
            )
            
            alert('Real backend broadcast test sent! Check if other users receive it.')
          } catch (error) {
            console.error('Real backend broadcast test error:', error)
            alert('Real backend broadcast test failed: ' + error.message)
          }
        }}
        style={{
          marginBottom: '15px',
          marginLeft: '10px',
          padding: '8px 16px',
          backgroundColor: '#20c997',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Test Real Backend
      </button>

      {/* Test WebSocket Instance */}
      <button 
        onClick={async () => {
          try {
            const websocketService = await import('@/lib/websocket')
            
            console.log('🔍 WebSocket Instance Debug:')
            console.log('- Current User:', currentUser?.id)
            console.log('- All Instances:', websocketService.default.getAllInstances())
            
            const allStatuses = websocketService.default.getConnectionStatus()
            console.log('- All Statuses:', allStatuses)
            
            const currentInstance = websocketService.default.getInstance(currentUser?.id)
            console.log('- Current Instance:', currentInstance)
            
            let statusText = `WebSocket Instance Debug:\n- Current User: ${currentUser?.id}\n\nAll Instances:\n`
            
            Object.entries(allStatuses).forEach(([userId, status]) => {
              statusText += `- User ${userId}: ${status.isConnected ? 'Connected' : 'Disconnected'}\n`
            })
            
            statusText += `\nTotal Instances: ${Object.keys(allStatuses).length}`
            
            alert(statusText)
          } catch (error) {
            console.error('WebSocket instance test error:', error)
            alert('WebSocket instance test failed: ' + error.message)
          }
        }}
        style={{
          marginBottom: '15px',
          marginLeft: '10px',
          padding: '8px 16px',
          backgroundColor: '#6f42c1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Test WS Instance
      </button>

      {/* Debug WebSocket connection button */}
      <button 
        onClick={async () => {
          try {
            const websocketService = await import('@/lib/websocket')
            const status = websocketService.default.getConnectionStatus()
            
            console.log('🔍 WebSocket Debug Info:')
            console.log('- Connection Status:', status)
            console.log('- WebSocket URL:', process.env.NEXT_PUBLIC_WS_URL || 'wss://chat-app-backend-3vsf.onrender.com/ws')
            console.log('- Current User:', currentUser?.id || 'No user')
            console.log('- Current Chat:', currentChat?.chat_id || 'No chat selected')
            
            alert(`WebSocket Debug:\n- Connected: ${status.isConnected}\n- URL: ${process.env.NEXT_PUBLIC_WS_URL || 'wss://chat-app-backend-3vsf.onrender.com/ws'}\n- User: ${currentUser?.id || 'None'}\n- Chat: ${currentChat?.chat_id || 'None'}`)
          } catch (error) {
            console.error('Debug error:', error)
            alert('Debug failed: ' + error.message)
          }
        }}
        style={{
          marginBottom: '15px',
          marginLeft: '10px',
          padding: '8px 16px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Debug WS
      </button>

      {/* Current Chat Debug Info */}
      {currentChat && (
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#e3f2fd',
          border: '2px solid #007AFF',
          borderRadius: '8px',
          fontSize: '12px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
            🎯 Currently Selected Chat:
          </div>
          <div>ID: {currentChat.chat_id}</div>
          <div>Name: {currentChat.name || currentChat.chat_name || currentChat.username}</div>
          <div>User: {currentUser?.id || 'None'}</div>
        </div>
      )}
      
      {/* Search Bar */}
      <input
        type="text"
        placeholder={showUserSearch ? "Search users..." : "Search chats..."}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          marginBottom: '20px',
          border: '1px solid #ddd',
          borderRadius: '20px',
          outline: 'none',
          backgroundColor: '#fff',
          color: '#000',
          fontSize: '14px',
          boxSizing: 'border-box'
        }}
      />

      {/* Toggle between chats and user search */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setShowUserSearch(false)}
          style={{
            padding: '8px 16px',
            backgroundColor: !showUserSearch ? '#007AFF' : '#f0f0f0',
            color: !showUserSearch ? 'white' : '#333',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Chats
        </button>
        <button
          onClick={() => setShowUserSearch(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: showUserSearch ? '#007AFF' : '#f0f0f0',
            color: showUserSearch ? 'white' : '#333',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Find Users
        </button>
      </div>
      
      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && !showUserSearch ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            Loading chats...
          </div>
        ) : displayChats.length > 0 ? (
          displayChats.map((item) => (
            <div 
              key={item.id || item.chat_id} 
              onClick={() => handleUserClick(item)}
              style={{ 
                display: 'flex', 
                gap: 12, 
                padding: '15px 10px', 
                alignItems: 'center', 
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background-color 0.2s',
                marginBottom: '5px',
                backgroundColor: currentChat?.chat_id === (item.chat_id || item.id) ? '#e3f2fd' : 'transparent',
                border: currentChat?.chat_id === (item.chat_id || item.id) ? '2px solid #007AFF' : '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (currentChat?.chat_id !== (item.chat_id || item.id)) {
                  e.target.style.backgroundColor = '#f5f5f5'
                }
              }}
              onMouseLeave={(e) => {
                if (currentChat?.chat_id !== (item.chat_id || item.id)) {
                  e.target.style.backgroundColor = 'transparent'
                }
              }}
            >
              <img 
                src={item.avatar || '/avatars/default.jpg'} 
                style={{ 
                  width: 45, 
                  height: 45, 
                  borderRadius: '50%',
                  objectFit: 'cover'
                }} 
                alt={item.name || item.username}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  fontSize: '14px',
                  color: '#333',
                  marginBottom: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.name || item.chat_name || item.username || `Chat ${item.chat_id || ''}`}
                </div>
                <div style={{ 
                  fontSize: '12px',
                  color: '#666',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.last_message || item.email || 'No messages yet'}
                </div>
              </div>
              {item.online && (
                <div style={{ 
                  width: 10, 
                  height: 10, 
                  backgroundColor: '#4CAF50', 
                  borderRadius: '50%',
                  marginLeft: 'auto',
                  flexShrink: 0
                }} />
              )}
              {showUserSearch && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCreateChat(item)
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    marginLeft: 'auto'
                  }}
                >
                  Chat
                </button>
              )}
            </div>
          ))
        ) : (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            padding: '20px',
            fontSize: '14px'
          }}>
            {searching ? 'Searching...' : 
             showUserSearch ? 'No users found' : 'No chats available'}
          </div>
        )}

        {/* Load More Button for Chats */}
        {!showUserSearch && nextCursor && !loading && (
          <button
            onClick={loadMoreChats}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#f0f0f0',
              color: '#666',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Load More Chats
          </button>
        )}
      </div>

      {/* Current User Info */}
      {currentUser && (
        <div style={{ 
          padding: '15px 10px', 
          borderTop: '1px solid #eee',
          marginTop: 'auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img 
              src={currentUser.avatar || '/avatars/default.jpg'} 
              style={{ 
                width: 35, 
                height: 35, 
                borderRadius: '50%',
                objectFit: 'cover'
              }} 
              alt="Current user"
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {currentUser.username}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {currentUser.email}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
