'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { getChatList, getMessageHistory, createPersonalChat, searchUsers as searchUsersAPI, checkSession } from '@/lib/api'
import websocketService from '@/lib/websocket'
import { useAuth } from './AuthContext'

const ChatContext = createContext()

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export function ChatProvider({ children }) {
  const { user: currentUser, isAuthenticated } = useAuth()
  const [messages, setMessages] = useState([])
  const [chats, setChats] = useState([])
  const [currentChat, setCurrentChat] = useState(null)
  const [users, setUsers] = useState([])
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const [hasLoadedChats, setHasLoadedChats] = useState(false)

  // Initialize WebSocket connection only when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      websocketService.connect()

      // Handle WebSocket messages
      websocketService.onMessage('chat_messages', (data) => {
        if (data.messages) {
          setMessages((previousMessages) => [...previousMessages, ...data.messages])
        }
      })

      websocketService.onMessage('new_message', (data) => {
        console.log('📨 Received new_message from WebSocket:', data);
        if (data.message) {
          // Handle message from API docs format
          const message = data.message
          const newMessage = {
            id: Date.now(),
            from: message.sender_id || message.from,
            text: message.content || message.text,
            content: message.content || message.text,
            timestamp: message.timestamp || new Date().toISOString(),
            chat_id: message.chat_id,
            ...message
          }
          console.log('📝 Adding new message to state:', newMessage);
          console.log('🔍 Current chat ID:', currentChat?.chat_id);
          console.log('🔍 Message chat ID:', message.chat_id);
          console.log('🔍 Should display message?', currentChat?.chat_id === message.chat_id);
          setMessages((previousMessages) => [...previousMessages, newMessage])
        }
      })

      // Handle real-time new chat room notification
      websocketService.onMessage('new_chat_room', (payload) => {
        const room = payload?.chat_room
        if (!room) return
        const normalizedRoom = {
          ...room,
          chat_id: room.chat_id || room.id,
          name: room.chat_name || room.name || 'New Chat',
          last_message: room.last_message || '',
        }
        setChats((previousChats) => [normalizedRoom, ...previousChats])
      })

      websocketService.onConnection('connected', () => {
        console.log('WebSocket connected successfully')
      })

      return () => {
        websocketService.disconnect()
      }
    }
  }, [isAuthenticated, currentUser])

  // Load initial chat list only when authenticated
  useEffect(() => {
    console.log('ChatContext useEffect triggered:', { isAuthenticated, currentUser })
    if (isAuthenticated && currentUser && !hasLoadedChats) {
      console.log('User authenticated, loading chat list...')
      setHasLoadedChats(true)
      loadChatList()
    } else if (!isAuthenticated) {
      console.log('User not authenticated yet, skipping chat list load')
    }
  }, [isAuthenticated, currentUser, hasLoadedChats])

  const loadChatList = async (cursor = null) => {
    console.log('loadChatList called with cursor:', cursor)
    console.log('Current auth state:', { isAuthenticated, currentUser })
    
    if (!isAuthenticated || !currentUser) {
      console.log('Cannot load chat list: user not authenticated')
      return
    }

    try {
      setLoading(true)
      // Do not block on a separate session check; rely on the chat endpoint itself
      console.log('Fetching chat list (no pre-check)...')
      const response = await getChatList(cursor)
      console.log('Chat list response:', response)
      
      if (cursor) {
        // Append to existing chats for pagination
        setChats(prev => [...prev, ...(response.chats || [])])
      } else {
        // Replace chats for initial load
        setChats(response.chats || [])
      }
      
      console.log('Updated chats state:', response.chats || [])
      
      // Save next cursor for pagination
      setNextCursor(response.next_cursor || null)
      
    } catch (error) {
      console.error('Error loading chat list:', error)
      // Set empty chats array on error to show the error state
      setChats([])
    } finally {
      setLoading(false)
    }
  }

  const loadMoreChats = () => {
    if (nextCursor && !loading) {
      loadChatList(nextCursor)
    }
  }

  const loadChatMessages = async (chatId, cursor = null) => {
    try {
      setLoading(true)
      
      // Load from API first - filter by chat_id
      const response = await getMessageHistory(cursor)
      
      if (cursor) {
        // Append to existing messages for pagination
        setMessages(prev => [...response.messages, ...prev])
      } else {
        // Replace messages for initial load - filter by current chat
        const chatMessages = response.messages.filter(msg => msg.chat_id === chatId)
        setMessages(chatMessages)
      }
      
      // Then request real-time updates via WebSocket
      websocketService.loadChat(chatId)
      
    } catch (error) {
      console.error('Error loading chat messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const addMessage = (message) => {
    console.log('💬 addMessage called with:', message);
    const newMessage = {
      id: Date.now(),
      from: message.from,
      text: message.text,
      content: message.text, // Also include content for WebSocket compatibility
      timestamp: new Date().toISOString(),
      chat_id: message.chat_id,
      ...message
    }
    
    console.log('📝 Adding message to local state:', newMessage);
    // Add to local state
    setMessages(prev => [...prev, newMessage])
    
    // Send via WebSocket if we have current chat
    if (currentChat && currentChat.chat_id) {
      console.log('📤 Sending message via WebSocket to chat:', currentChat.chat_id);
      websocketService.sendNewMessage(
        currentChat.chat_id,
        message.from,
        message.text
      )
    } else {
      console.error('❌ No current chat or chat_id - cannot send message');
    }
  }

  const createChat = async (userId) => {
    try {
      const response = await createPersonalChat(userId)
      
      // Handle different response structures from backend
      const newChat = response.chat || response.chat_room || response
      if (newChat) {
        // Normalize the new chat to match our expected format
        const normalizedChat = {
          ...newChat,
          chat_id: newChat.chat_id || newChat.id,
          name: newChat.chat_name || newChat.name || newChat.username || 'New Chat',
          last_message: newChat.last_message || '',
        }
        
        // Add new chat to list
        setChats(prev => [normalizedChat, ...prev])
        return normalizedChat
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      throw error
    }
  }

  const searchUsers = async (query) => {
    try {
      const response = await searchUsersAPI(query)
      return response.users || []
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  }

  const setCurrentChatUser = (chat) => {
    setCurrentChat(chat)
    if (chat && chat.chat_id) {
      loadChatMessages(chat.chat_id)
    }
  }

  const getMessagesForUser = (chatId) => {
    return messages.filter(msg => msg.chat_id === chatId)
  }

  const updateUserStatus = (userId, online) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, online } : user
    ))
  }

  const value = {
    messages,
    chats,
    currentChat,
    users,
    onlineUsers,
    loading,
    nextCursor,
    addMessage,
    updateUserStatus,
    setCurrentChatUser,
    getMessagesForUser,
    searchUsers,
    createChat,
    loadChatList,
    loadMoreChats,
    loadChatMessages,
    setMessages,
    setUsers,
    setChats
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}
