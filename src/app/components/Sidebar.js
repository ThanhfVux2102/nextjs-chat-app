'use client'

import { useState } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

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

  const { user: currentUser, logout } = useAuth()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [searching, setSearching] = useState(false)
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)

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

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleResetPassword = () => {
    router.push('/reset-password')
  }

  const handleAddClick = () => {
    setShowUserSearch(true)
    setSearchQuery('')
  }

  const displayChats = showUserSearch ? searchResults : (Array.isArray(chats) ? chats : [])

  return (
    <div style={{ padding: 10, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Messages title and buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20,
        position: 'relative'
      }}>
        <h3 style={{ fontSize: 30, fontWeight: 700, margin: 0 }}>Messages</h3>
        
        {/* Buttons container */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Add button */}
          <button
            onClick={handleAddClick}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#007AFF',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007AFF'}
          >
            +
          </button>
          
          {/* Settings button with dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
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
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            >
              ⚙️
            </button>
            
            {/* Settings dropdown */}
            {showSettingsDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                minWidth: 150
              }}>
                <button
                  onClick={handleResetPassword}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: '#333',
                    borderBottom: '1px solid #eee'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Reset Password
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: '#d32f2f'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffebee'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showSettingsDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowSettingsDropdown(false)}
        />
      )}

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
                  src={item.avatar || '/default-avatar.svg'}
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
              src={currentUser.avatar || '/default-avatar.svg'}
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
