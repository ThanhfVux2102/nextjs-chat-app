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

  // Initialize WebSocket connection only when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      websocketService.connect()
      
      // Handle WebSocket messages
      websocketService.onMessage('chat_messages', (data) => {
        if (data.messages) {
          setMessages(prev => [...prev, ...data.messages])
        }
      });

      websocketService.onMessage('new_message', (data) => {
        if (data.message) {
          setMessages(prev => [...prev, data.message])
        }
      });

      websocketService.onConnection('connected', () => {
        console.log('WebSocket connected successfully')
      });

      return () => {
        websocketService.disconnect()
      }
    }
  }, [isAuthenticated, currentUser])

  // Load initial chat list only when authenticated
  useEffect(() => {
    console.log('ChatContext useEffect triggered:', { isAuthenticated, currentUser })
    if (isAuthenticated && currentUser) {
      console.log('User authenticated, loading chat list...')
      loadChatList()
    } else {
      console.log('User not authenticated yet, skipping chat list load')
    }
  }, [isAuthenticated, currentUser])

  const loadChatList = async (cursor = null) => {
    console.log('loadChatList called with cursor:', cursor)
    console.log('Current auth state:', { isAuthenticated, currentUser })
    
    if (!isAuthenticated || !currentUser) {
      console.log('Cannot load chat list: user not authenticated')
      return
    }

    try {
      setLoading(true)
      
      // First check if session is valid
      console.log('Checking session before loading chats...')
      const sessionData = await checkSession()
      console.log('Session check result:', sessionData)
      
      if (!sessionData) {
        console.error('Session check failed, user may not be properly authenticated')
        throw new Error('Session validation failed')
      }
      
      console.log('Session valid, fetching chat list from:', `${process.env.NEXT_PUBLIC_API_URL || 'https://chat-app-backend-3vsf.onrender.com'}/api/chat/me/view`)
      
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
      if (response.next_cursor) {
        setNextCursor(response.next_cursor)
      }
      
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
      
      // Load from API first
      const response = await getMessageHistory(cursor)
      
      if (cursor) {
        // Append to existing messages for pagination
        setMessages(prev => [...response.messages, ...prev])
      } else {
        // Replace messages for initial load
        setMessages(response.messages)
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
    const newMessage = {
      id: Date.now(),
      from: message.from,
      text: message.text,
      timestamp: new Date().toISOString(),
      ...message
    }
    
    // Add to local state
    setMessages(prev => [...prev, newMessage])
    
    // Send via WebSocket if we have current chat
    if (currentChat && currentChat.chat_id) {
      websocketService.sendNewMessage(
        currentChat.chat_id,
        message.from,
        message.text
      )
    }
  }

  const createChat = async (userId) => {
    try {
      const response = await createPersonalChat(userId)
      
      if (response.chat) {
        // Add new chat to list
        setChats(prev => [response.chat, ...prev])
        return response.chat
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
