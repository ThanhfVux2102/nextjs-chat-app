'use client'

import { useState } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { useAuth } from '@/contexts/AuthContext'

export default function Sidebar() {
  const {
    chats,
    searchUsers,
    setCurrentChatUser,
    loading,
    loadMoreChats,
    nextCursor,
    createChat,
    currentChat,
  } = useChat()

  const { user: currentUser } = useAuth()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [searching, setSearching] = useState(false)

  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (query.trim()) {
      setSearching(true)
      try {
        const results = await searchUsers(query)
        setSearchResults(results)
        setShowUserSearch(true)
      } catch (err) {
        console.error('Error searching users:', err)
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
    <div style={{ padding: 10, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: 30, fontWeight: 700, marginBottom: 20 }}>Messages</h3>

      <input
        type="text"
        placeholder={showUserSearch ? 'Search users...' : 'Search chats...'}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          marginBottom: 20,
          border: '1px solid #ddd',
          borderRadius: 20,
          outline: 'none',
          backgroundColor: '#fff',
          color: '#000',
          fontSize: 14,
          boxSizing: 'border-box',
        }}
      />

      <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <button
          onClick={() => setShowUserSearch(false)}
          style={{
            padding: '8px 16px',
            backgroundColor: !showUserSearch ? '#007AFF' : '#f0f0f0',
            color: !showUserSearch ? '#fff' : '#333',
            border: 'none',
            borderRadius: 20,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Chats
        </button>
        <button
          onClick={() => setShowUserSearch(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: showUserSearch ? '#007AFF' : '#f0f0f0',
            color: showUserSearch ? '#fff' : '#333',
            border: 'none',
            borderRadius: 20,
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          Find Users
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && !showUserSearch ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>Loading chats...</div>
        ) : displayChats.length > 0 ? (
          displayChats.map((item) => {
            const isActive = currentChat?.chat_id === (item.chat_id || item.id)
            return (
              <div
                key={item.id || item.chat_id}
                onClick={() => handleUserClick(item)}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '15px 10px',
                  alignItems: 'center',
                  cursor: 'pointer',
                  borderRadius: 8,
                  transition: 'background-color .2s',
                  marginBottom: 5,
                  backgroundColor: isActive ? '#e3f2fd' : 'transparent',
                  border: isActive ? '2px solid #007AFF' : '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#f5f5f5'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <img
                  src={item.avatar || '/avatars/default.jpg'}
                  alt={item.name || item.username || 'chat'}
                  style={{ width: 45, height: 45, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 'bold',
                      fontSize: 14,
                      color: '#333',
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.name || item.chat_name || item.username || `Chat ${item.chat_id || ''}`}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#666',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.last_message || item.email || 'No messages yet'}
                  </div>
                </div>
                {showUserSearch && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCreateChat(item)
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 11,
                      marginLeft: 'auto',
                    }}
                  >
                    Chat
                  </button>
                )}
              </div>
            )
          })
        ) : (
          <div style={{ textAlign: 'center', color: '#666', padding: 20, fontSize: 14 }}>
            {searching ? 'Searching...' : showUserSearch ? 'No users found' : 'No chats available'}
          </div>
        )}
        {!showUserSearch && nextCursor && !loading && (
          <button
            onClick={loadMoreChats}
            style={{
              width: '100%',
              padding: 10,
              backgroundColor: '#f0f0f0',
              color: '#666',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              marginTop: 10,
            }}
          >
            Load More Chats
          </button>
        )}
      </div>

      {currentUser && (
        <div style={{ padding: '15px 10px', borderTop: '1px solid #eee', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={currentUser.avatar || '/avatars/default.jpg'}
              alt="Current user"
              style={{ width: 35, height: 35, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 'bold' }}>{currentUser.username}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{currentUser.email}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
