'use client'

import { useState, useEffect } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { useAuth } from '@/contexts/AuthContext'

export default function Sidebar() {
  const { chats, searchUsers, setCurrentChatUser, loading, loadMoreChats, nextCursor, createChat } = useChat() // Updated context destructuring
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

  const displayChats = showUserSearch ? searchResults : chats

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
                marginBottom: '5px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
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
                  {item.name || item.username}
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
