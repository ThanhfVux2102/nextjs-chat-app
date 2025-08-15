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
    createGroup,
    deleteChat,
    currentChat,
    testBackendEndpoints,
  } = useChat()

  const { user: currentUser, logout } = useAuth()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [chatSearchResults, setChatSearchResults] = useState([])
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [searching, setSearching] = useState(false)
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [modalSearchQuery, setModalSearchQuery] = useState('')
  const [modalSearchResults, setModalSearchResults] = useState([])
  const [modalSearching, setModalSearching] = useState(false)
  const [selectedGroupUsers, setSelectedGroupUsers] = useState([])
  const [groupName, setGroupName] = useState('')
  const [openChatOptionsId, setOpenChatOptionsId] = useState(null)

  const handleSearch = async (query) => {
    console.log('🔍 Search triggered with query:', query)
    setSearchQuery(query)
    if (query.trim()) {
      setSearching(true)
      try {
        console.log('🔍 Calling searchUsers with query:', query)
        // Run user search while also filtering chats locally
        const [results] = await Promise.all([
          searchUsers(query),
        ])
        console.log('🔍 Search results received:', results)
        console.log('🔍 Search results type:', typeof results)
        console.log('🔍 Search results is array:', Array.isArray(results))
        console.log('🔍 Search results keys:', results ? Object.keys(results) : 'null/undefined')

        // Handle different response formats
        let users = []
        if (Array.isArray(results)) {
          users = results
        } else if (results && Array.isArray(results.users)) {
          users = results.users
        } else if (results && Array.isArray(results.data)) {
          users = results.data
        } else if (results && results.items && Array.isArray(results.items)) {
          users = results.items
        } else {
          console.log('🔍 No recognizable array found in results, using empty array')
          users = []
        }

        console.log('🔍 Processed users array:', users)
        setSearchResults(users)

        // Filter chats locally based on name or last_message match
        const chatMatches = (Array.isArray(chats) ? chats : []).filter((c) => {
          const hay = `${c.name || c.chat_name || c.username || ''} ${c.last_message || ''}`.toLowerCase()
          return hay.includes(query.toLowerCase())
        })
        setChatSearchResults(chatMatches)

        // Enter combined search view
        setShowUserSearch(true)
        console.log('🔍 Search results set, showUserSearch set to true')
      } catch (err) {
        console.error('Error searching users:', err)

        // Check if it's an authentication error
        if (err.status === 401 || err.message?.includes('Authentication expired')) {
          alert('Your session has expired. Please log in again.')
          logout()
          router.push('/login')
          return
        }

        setSearchResults([])
        setChatSearchResults([])
      } finally {
        setSearching(false)
      }
    } else {
      console.log('🔍 Empty query, clearing search results')
      setSearchResults([])
      setChatSearchResults([])
      setShowUserSearch(false)
    }
  }

  const handleModalSearch = async (query) => {
    console.log('🔍 Modal search triggered with query:', query)
    setModalSearchQuery(query)
    if (query.trim()) {
      setModalSearching(true)
      try {
        console.log('🔍 Calling searchUsers with query:', query)
        const results = await searchUsers(query)
        console.log('🔍 Modal search results received:', results)
        console.log('🔍 Modal search results type:', typeof results)
        console.log('🔍 Modal search results is array:', Array.isArray(results))
        console.log('🔍 Modal search results keys:', results ? Object.keys(results) : 'null/undefined')

        // Handle different response formats
        let users = []
        if (Array.isArray(results)) {
          users = results
        } else if (results && Array.isArray(results.users)) {
          users = results.users
        } else if (results && Array.isArray(results.data)) {
          users = results.data
        } else if (results && results.items && Array.isArray(results.items)) {
          users = results.items
        } else {
          console.log('🔍 No recognizable array found in modal results, using empty array')
          users = []
        }

        console.log('🔍 Processed modal users array:', users)
        setModalSearchResults(users)
      } catch (err) {
        console.error('Error searching users in modal:', err)

        // Check if it's an authentication error
        if (err.status === 401 || err.message?.includes('Authentication expired')) {
          alert('Your session has expired. Please log in again.')
          logout()
          router.push('/login')
          return
        }

        setModalSearchResults([])
      } finally {
        setModalSearching(false)
      }
    } else {
      console.log('🔍 Empty modal query, clearing results')
      setModalSearchResults([])
    }
  }

  const handleUserClick = (chat) => {
    setCurrentChatUser(chat)
    setShowUserSearch(false)
    setSearchQuery('')
  }

  const handleCreateChat = async (user) => {
    console.log('🎯 USER CLICKED "Chat" BUTTON!')
    console.log('🔍 handleCreateChat called with user:', user)
    console.log('🔍 User ID:', user.id)
    console.log('🔍 User object keys:', Object.keys(user))
    console.log('🔍 SIDEBAR DEBUG: currentUser from useAuth():', JSON.stringify(currentUser, null, 2))
    console.log('🔍 SIDEBAR DEBUG: currentUser?.id:', currentUser?.id)
    console.log('🔍 SIDEBAR DEBUG: currentUser?.user_id:', currentUser?.user_id)
    try {
      const newChat = await createChat(user.id, user)
      console.log('🔍 Chat creation successful, newChat:', newChat)
      if (newChat) {
        setCurrentChatUser(newChat)
        setShowUserSearch(false)
        setSearchQuery('')
        setShowUserModal(false)
        setModalSearchQuery('')
        setModalSearchResults([])
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      })
      // UI alert handled inside ChatContext.createChat; avoid duplicate popups here
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
    console.log('🔍 Add button clicked, opening group modal')
    setShowGroupModal(true)
    setModalSearchQuery('')
    setModalSearchResults([])
    setSelectedGroupUsers([])
    setGroupName('')
  }

  const toggleSelectGroupUser = (user) => {
    setSelectedGroupUsers((prev) => {
      const exists = prev.find(u => u.id === user.id)
      if (exists) return prev.filter(u => u.id !== user.id)
      return [...prev, user]
    })
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Please enter a group name')
      return
    }
    if (selectedGroupUsers.length < 1) {
      alert('Please select at least one participant')
      return
    }
    try {
      const participantIds = selectedGroupUsers.map(u => u.id)
      const newChat = await createGroup({ name: groupName.trim(), participantIds, adminIds: [] })
      if (newChat) {
        setShowGroupModal(false)
        setGroupName('')
        setSelectedGroupUsers([])
        setCurrentChatUser(newChat)
      }
    } catch (e) {
      // errors handled in context
    }
  }

  const displayChats = showUserSearch ? searchResults : (Array.isArray(chats) ? chats : [])
  console.log('🔍 Display debug:', {
    showUserSearch,
    searchResults,
    chats: Array.isArray(chats) ? chats : [],
    displayChats,
    displayChatsLength: displayChats.length
  })

  return (
    <>
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
                    onClick={async () => {
                      console.log('🔍 Testing backend endpoints...')
                      try {
                        const results = await testBackendEndpoints()
                        console.log('🔍 Backend test results:', results)
                        alert('Backend test completed. Check console for results.')
                      } catch (error) {
                        console.error('🔍 Backend test failed:', error)
                        alert('Backend test failed. Check console for details.')
                      }
                    }}
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
                    Test Backend
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
          placeholder={'Search chats or users...'}
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
            onClick={() => {
              console.log('🔍 Chats button clicked, setting showUserSearch to false')
              setShowUserSearch(false)
            }}
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
            onClick={() => {
              console.log('🔍 Find Users button clicked, setting showUserSearch to true')
              setShowUserSearch(true)
            }}
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
          {loading && !showUserSearch && !searchQuery.trim() ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>Loading chats...</div>
          ) : searchQuery.trim() ? (
            <>
              <div style={{ fontSize: 12, color: '#666', padding: '4px 8px' }}>Chats</div>
              {chatSearchResults.length > 0 ? (
                chatSearchResults.map((item) => {
                  const isActive = currentChat?.chat_id === (item.chat_id || item.id)
                  return (
                    <div
                      key={`chat-${item.id || item.chat_id}`}
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
                        position: 'relative'
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
                          {item.last_message || item.email || ''}
                        </div>
                      </div>
                      <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          title="Options"
                          onClick={() => {
                            const id = item.chat_id || item.id
                            setOpenChatOptionsId(prev => prev === id ? null : id)
                          }}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: '#f0f0f0',
                            color: '#333',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                            lineHeight: '32px',
                            padding: 0
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                        >
                          ⋯
                        </button>
                        {openChatOptionsId === (item.chat_id || item.id) && (
                          <div style={{ position: 'absolute', top: 40, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, minWidth: 150 }}>
                            <button
                              onClick={async () => {
                                const id = item.chat_id || item.id
                                const ok = confirm('Delete this chat? This cannot be undone.')
                                if (!ok) return
                                await deleteChat(id)
                                setOpenChatOptionsId(null)
                              }}
                              style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: 14, color: '#d32f2f' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffebee'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              Delete chat
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: 10, fontSize: 12 }}>No chats found</div>
              )}

              <div style={{ fontSize: 12, color: '#666', padding: '8px 8px 4px' }}>Users</div>
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <div
                    key={`user-${item.id || item.user_id}`}
                    onClick={() => handleCreateChat(item)}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '15px 10px',
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderRadius: 8,
                      transition: 'background-color .2s',
                      marginBottom: 5,
                      border: '1px solid #eee'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <img
                      src={item.avatar || '/default-avatar.svg'}
                      alt={item.username || item.name || 'user'}
                      style={{ width: 45, height: 45, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 14, color: '#333', marginBottom: 4 }}>
                        {item.username || item.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.email || ''}
                      </div>
                    </div>
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
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: 10, fontSize: 12 }}>No users found</div>
              )}
            </>
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
                    position: 'relative'
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
                      {item.last_message || item.email || ''}
                    </div>
                  </div>
                  <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      title="Options"
                      onClick={() => {
                        const id = item.chat_id || item.id
                        setOpenChatOptionsId(prev => prev === id ? null : id)
                      }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: '#f0f0f0',
                        color: '#333',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        lineHeight: '32px',
                        padding: 0
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                    >
                      ⋯
                    </button>
                    {openChatOptionsId === (item.chat_id || item.id) && (
                      <div style={{ position: 'absolute', top: 40, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, minWidth: 150 }}>
                        <button
                          onClick={async () => {
                            const id = item.chat_id || item.id
                            const ok = confirm('Delete this chat? This cannot be undone.')
                            if (!ok) return
                            await deleteChat(id)
                            setOpenChatOptionsId(null)
                          }}
                          style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: 14, color: '#d32f2f' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffebee'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          Delete chat
                        </button>
                      </div>
                    )}
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

      {/* User Search Modal */}
      {showUserModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 24,
            width: '90%',
            maxWidth: 500,
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 'bold', margin: 0 }}>Find Users</h3>
              <button
                onClick={() => {
                  setShowUserModal(false)
                  setModalSearchQuery('')
                  setModalSearchResults([])
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search users by username or email..."
              value={modalSearchQuery}
              onChange={(e) => handleModalSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                marginBottom: 20,
                border: '1px solid #ddd',
                borderRadius: 8,
                outline: 'none',
                backgroundColor: '#fff',
                color: '#000',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />

            {/* Search Results */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {modalSearching ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>
                  Searching...
                </div>
              ) : modalSearchResults.length > 0 ? (
                modalSearchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleCreateChat(user)}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '15px 10px',
                      alignItems: 'center',
                      cursor: 'pointer',
                      borderRadius: 8,
                      transition: 'background-color .2s',
                      marginBottom: 5,
                      border: '1px solid #eee'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <img
                      src={user.avatar || '/default-avatar.svg'}
                      alt={user.username || user.name}
                      style={{ width: 45, height: 45, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 'bold',
                        fontSize: 14,
                        color: '#333',
                        marginBottom: 4
                      }}>
                        {user.username || user.name}
                      </div>
                      <div style={{
                        fontSize: 12,
                        color: '#666'
                      }}>
                        {user.email}
                      </div>
                    </div>
                    <button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#007AFF',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      Start Chat
                    </button>
                  </div>
                ))
              ) : modalSearchQuery ? (
                <div style={{ textAlign: 'center', color: '#666', padding: 20, fontSize: 14 }}>
                  No users found
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: 20, fontSize: 14 }}>
                  Start typing to search for users
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group Create Modal */}
      {showGroupModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 24,
            width: '90%',
            maxWidth: 560,
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 20, fontWeight: 'bold', margin: 0 }}>Create Group</h3>
              <button
                onClick={() => setShowGroupModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#666' }}
              >
                ×
              </button>
            </div>
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                marginBottom: 12,
                border: '1px solid #ddd',
                borderRadius: 8,
                outline: 'none',
                backgroundColor: '#fff',
                color: '#000',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
            <input
              type="text"
              placeholder="Search users to add..."
              value={modalSearchQuery}
              onChange={(e) => handleModalSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                marginBottom: 12,
                border: '1px solid #ddd',
                borderRadius: 8,
                outline: 'none',
                backgroundColor: '#fff',
                color: '#000',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {selectedGroupUsers.map((u) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', border: '1px solid #eee', borderRadius: 16 }}>
                  <img src={u.avatar || '/default-avatar.svg'} style={{ width: 18, height: 18, borderRadius: '50%' }} />
                  <span style={{ fontSize: 12 }}>{u.username || u.name}</span>
                  <button onClick={() => toggleSelectGroupUser(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f' }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
              {modalSearching ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>Searching...</div>
              ) : modalSearchResults.length > 0 ? (
                modalSearchResults.map((user) => {
                  const selected = !!selectedGroupUsers.find(u => u.id === user.id)
                  return (
                    <div
                      key={`pick-${user.id}`}
                      onClick={() => toggleSelectGroupUser(user)}
                      style={{
                        display: 'flex',
                        gap: 12,
                        padding: '12px 10px',
                        alignItems: 'center',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f5f5f5',
                        backgroundColor: selected ? '#e3f2fd' : 'transparent'
                      }}
                    >
                      <img src={user.avatar || '/default-avatar.svg'} alt={user.username || user.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 14, color: '#333' }}>{user.username || user.name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{user.email}</div>
                      </div>
                      <input type="checkbox" readOnly checked={selected} />
                    </div>
                  )
                })
              ) : (
                <div style={{ textAlign: 'center', color: '#666', padding: 20, fontSize: 14 }}>Start typing to search for users</div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => setShowGroupModal(false)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateGroup} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', backgroundColor: '#007AFF', color: '#fff', cursor: 'pointer' }}>Create Group</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
