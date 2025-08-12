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
  const [sentMessages, setSentMessages] = useState(new Set()) // Track messages we sent

  // Initialize WebSocket connection only when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      websocketService.connect(currentUser.id)

      // Handle WebSocket messages
      websocketService.onMessage('chat_messages', (data) => {
        if (data.messages) {
          setMessages((previousMessages) => [...previousMessages, ...data.messages])
        }
      })

      websocketService.onMessage('new_message', (data) => {
        console.log('📨 Received new_message from WebSocket:', data);
        
        // Handle both formats: data.message and direct data
        let messageData = data.message || data;
        
        if (messageData) {
          // Handle message from API docs format
          const newMessage = {
            id: Date.now(),
            from: messageData.sender_id || messageData.from,
            text: messageData.content || messageData.text,
            content: messageData.content || messageData.text,
            timestamp: messageData.timestamp || new Date().toISOString(),
            chat_id: messageData.chat_id,
            ...messageData
          }
          console.log('📝 Adding new message to state:', newMessage);
          console.log('🔍 Current chat ID:', currentChat?.chat_id);
          console.log('🔍 Message chat ID:', messageData.chat_id);
          console.log('🔍 Should display message?', currentChat?.chat_id === messageData.chat_id);
          setMessages((previousMessages) => [...previousMessages, newMessage])
        }
      })

      // Handle personal_message type that backend actually sends
      websocketService.onMessage('personal_message', (data) => {
        console.log('📨 Received personal_message from WebSocket:', data);
        console.log('🔍 Full data structure:', JSON.stringify(data, null, 2));
        
        // Handle both formats: data.message and direct data
        let messageData = data.message || data;
        console.log('🔍 Extracted messageData:', messageData);
        
        if (messageData) {
          // Handle message from API docs format
          const newMessage = {
            id: Date.now(),
            from: messageData.sender_id || messageData.from || messageData.sender,
            text: messageData.content || messageData.text || messageData.message,
            content: messageData.content || messageData.text || messageData.message,
            timestamp: messageData.timestamp || new Date().toISOString(),
            chat_id: messageData.chat_id || messageData.chatId || currentChat?.chat_id,
            ...messageData
          }
          console.log('📝 Adding personal message to state:', newMessage);
          console.log('🔍 Current chat ID:', currentChat?.chat_id);
          console.log('🔍 Message chat ID:', newMessage.chat_id);
          console.log('🔍 Should display message?', currentChat?.chat_id === newMessage.chat_id);
          setMessages((previousMessages) => [...previousMessages, newMessage])
        } else {
          console.log('❌ No messageData found in personal_message');
        }
      })

      // Handle group_message type that backend is actually sending
      websocketService.onMessage('group_message', (data) => {
        console.log('📨 Received group_message from WebSocket:', data);
        console.log('🔍 Full data structure:', JSON.stringify(data, null, 2));
        
        // Handle both formats: data.message and direct data
        let messageData = data.data || data.message || data;
        console.log('🔍 Extracted messageData:', messageData);
        console.log('🔍 Available fields in messageData:', Object.keys(messageData || {}));
        console.log('🔍 sender_id:', messageData?.sender_id);
        console.log('🔍 sender:', messageData?.sender);
        console.log('🔍 from:', messageData?.from);
        console.log('🔍 user_id:', messageData?.user_id);
        console.log('🔍 chat_id:', messageData?.chat_id);
        
        if (messageData) {
          // Check if this message is from the current user using our tracking system
          const messageContent = messageData.content || messageData.text || messageData.message;
          const messageChatId = data.chat_id || messageData.chat_id || messageData.chatId || currentChat?.chat_id;
          
          // Check if we recently sent a message with this content and chat_id
          const isFromCurrentUser = Array.from(sentMessages).some(sentKey => {
            const [sentText, sentChatId] = sentKey.split('-');
            return sentText === messageContent && sentChatId === messageChatId;
          });
          
          // Use current user ID if it's our message, otherwise use the WebSocket sender_id
          const senderId = isFromCurrentUser ? currentUser?.id : (messageData.sender_id || messageData.sender || messageData.from || messageData.user_id);
          
          // Handle message from API docs format
          const newMessage = {
            id: Date.now(),
            from: senderId,
            text: messageContent,
            content: messageContent,
            timestamp: messageData.timestamp || new Date().toISOString(),
            chat_id: messageChatId,
            ...messageData
          }
          console.log('📝 Adding group message to state:', newMessage);
          console.log('🔍 Current chat ID:', currentChat?.chat_id);
          console.log('🔍 Message chat ID:', newMessage.chat_id);
          console.log('🔍 Message sender ID:', newMessage.from);
          console.log('🔍 Is from current user?', isFromCurrentUser);
          console.log('🔍 Message content:', messageContent);
          console.log('🔍 Sent messages tracking:', Array.from(sentMessages));
          console.log('🔍 Should display message?', currentChat?.chat_id === newMessage.chat_id);
          console.log('🔍 Current messages count before adding:', messages.length);
          
          // Check if message already exists to prevent duplicates
          setMessages((previousMessages) => {
            console.log('🔍 Previous messages count:', previousMessages.length);
            const messageExists = previousMessages.some(msg => 
              msg.text === newMessage.text && 
              msg.from === newMessage.from && 
              Math.abs(new Date(msg.timestamp) - new Date(newMessage.timestamp)) < 5000 // Within 5 seconds
            );
            
            if (messageExists) {
              console.log('🚫 Message already exists in state, skipping duplicate');
              return previousMessages;
            }
            
            console.log('✅ Adding new message to state');
            const updatedMessages = [...previousMessages, newMessage];
            console.log('🔍 Updated messages count:', updatedMessages.length);
            return updatedMessages;
          });
        } else {
          console.log('❌ No messageData found in group_message');
        }
      })
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
      console.log('Fetching chat list (no pre-check)...')
      const response = await getChatList(cursor)
      console.log('Chat list response:', response)
      
      if (cursor) {
        setChats(prev => [...prev, ...(response.chats || [])])
      } else {
        setChats(response.chats || [])
      }
      
      console.log('Updated chats state:', response.chats || [])
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
        setMessages(prev => [...response.messages, ...prev])
      } else {
        const chatMessages = response.messages.filter(msg => msg.chat_id === chatId)
        setMessages(chatMessages)
      }
      
      // request real-time updates via WebSocket
      websocketService.loadChat(chatId)
      
    } catch (error) {
      console.error('Error loading chat messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const addMessage = (message) => {
    console.log('addMessage called with:', message);
    const newMessage = {
      id: Date.now(),
      from: message.from,
      text: message.text,
      content: message.text, // Also include content for WebSocket compatibility
      timestamp: new Date().toISOString(),
      chat_id: message.chat_id,
      ...message
    }
    
    console.log('Preparing to send message via WebSocket:', newMessage);
    
    // Track this message as sent by us
    const messageKey = `${message.text}-${message.chat_id}-${Date.now()}`;
    setSentMessages(prev => new Set([...prev, messageKey]));
    console.log('📝 Tracking sent message:', messageKey);
    
    // Send via WebSocket if we have current chat
    if (currentChat && currentChat.chat_id) {
      console.log('Sending message via WebSocket to chat:', currentChat.chat_id);
      websocketService.sendNewMessage(
        currentChat.chat_id,
        message.from,
        message.text
      )
    } else {
      console.error('No current chat or chat_id - cannot send message');
    }
  }

  const createChat = async (userId) => {
    try {
      const response = await createPersonalChat(userId)
      const newChat = response.chat || response.chat_room || response
      if (newChat) {
        const normalizedChat = {
          ...newChat,
          chat_id: newChat.chat_id || newChat.id,
          name: newChat.chat_name || newChat.name || newChat.username || 'New Chat',
          last_message: newChat.last_message || '',
        }
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
    console.log('🔍 getMessagesForUser Debug:')
    console.log('- Requested Chat ID:', chatId)
    console.log('- All Messages in State:', messages)
    console.log('- Messages with chat_id:', messages.filter(msg => msg.chat_id))
    console.log('- Messages with matching chat_id:', messages.filter(msg => msg.chat_id === chatId))
    
    const filteredMessages = messages.filter(msg => msg.chat_id === chatId)
    console.log('- Returning filtered messages:', filteredMessages)
    console.log('- Filtered messages count:', filteredMessages.length)
    console.log('- Filtered messages details:', filteredMessages.map(msg => ({
      id: msg.id,
      from: msg.from,
      text: msg.text,
      chat_id: msg.chat_id
    })))
    return filteredMessages
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
