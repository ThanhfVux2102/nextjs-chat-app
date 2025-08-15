'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { getChatList, getMessageHistory, createPersonalChat, createGroupChat as createGroupChatAPI, deleteChat as deleteChatAPI, searchUsers as searchUsersAPI, checkSession, testBackendEndpoints } from '@/lib/api'
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
  const [messagePagination, setMessagePagination] = useState({})
  const [hasLoadedChats, setHasLoadedChats] = useState(false)
  const [sentMessages, setSentMessages] = useState(new Set()) // Track messages we sent
  const [recentSentContent, setRecentSentContent] = useState(new Set()) // Track recent sent content
  const [recentMessages, setRecentMessages] = useState([]) // Track recent messages for echo detection

  // Message persistence functions
  const getMessagesStorageKey = (chatId) => `chatMessages_${currentUser?.id}_${chatId}`
  
  const persistMessagesForChat = (chatId, messages) => {
    if (!chatId || !currentUser?.id) return
    try {
      const chatMessages = messages.filter(m => m.chat_id === chatId)
      // Keep only last 200 messages per chat to avoid storage limits
      const recentMessages = chatMessages.slice(-200)
      const key = getMessagesStorageKey(chatId)
      localStorage.setItem(key, JSON.stringify(recentMessages))
      console.log(`💾 Persisted ${recentMessages.length} messages for chat ${chatId}`)
    } catch (error) {
      console.warn('Failed to persist messages:', error)
    }
  }
  
  const loadPersistedMessages = (chatId) => {
    if (!chatId || !currentUser?.id) return []
    try {
      const key = getMessagesStorageKey(chatId)
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)
        console.log(`📂 Loaded ${parsed.length} persisted messages for chat ${chatId}`)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (error) {
      console.warn('Failed to load persisted messages:', error)
    }
    return []
  }
  
  const clearPersistedMessages = (chatId) => {
    if (!chatId || !currentUser?.id) return
    try {
      const key = getMessagesStorageKey(chatId)
      localStorage.removeItem(key)
      console.log(`🗑️ Cleared persisted messages for chat ${chatId}`)
    } catch (error) {
      console.warn('Failed to clear persisted messages:', error)
    }
  }

  // Persist messages whenever they change
  useEffect(() => {
    if (messages.length > 0 && currentUser?.id) {
      // Group messages by chat_id and persist each chat's messages
      const messagesByChat = messages.reduce((acc, msg) => {
        if (msg.chat_id) {
          if (!acc[msg.chat_id]) acc[msg.chat_id] = []
          acc[msg.chat_id].push(msg)
        }
        return acc
      }, {})
      
      // Persist messages for each chat
      Object.entries(messagesByChat).forEach(([chatId, chatMessages]) => {
        persistMessagesForChat(chatId, chatMessages)
      })
    }
  }, [messages, currentUser?.id])

  // Helper: add or update a chat item without creating duplicates
  const upsertChat = (incomingChat) => {
    if (!incomingChat) return
    const incomingId = incomingChat.chat_id || incomingChat.id
    if (!incomingId) return
    setChats((previousChats) => {
      const index = previousChats.findIndex(c => (c.chat_id || c.id) === incomingId)
      if (index !== -1) {
        const updated = [...previousChats]
        updated[index] = { ...previousChats[index], ...incomingChat }
        return updated
      }
      return [incomingChat, ...previousChats]
    })
  }

  const updateChatLastMessage = (chatId, text, timestamp = new Date().toISOString()) => {
    if (!chatId) return
    setChats((previousChats) => {
      const idx = previousChats.findIndex(c => (c.chat_id || c.id) === chatId)
      if (idx === -1) return previousChats
      const updatedChat = {
        ...previousChats[idx],
        last_message: text,
        last_message_time: timestamp
      }
      const next = [...previousChats]
      next.splice(idx, 1)
      // move updated chat to top
      return [updatedChat, ...next]
    })
  }

  const addToRecentSent = (content, chatId) => {
    const key = `${content}-${chatId}`;
    setRecentSentContent(prev => new Set([...prev, key]));
    
    setTimeout(() => {
      setRecentSentContent(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }, 10000);
  }

  const addToRecentMessages = (message) => {
    const messageWithTimestamp = {
      ...message,
      timestamp: Date.now()
    };
    console.log('📝 Adding to recent messages:', messageWithTimestamp);
    
    // Use functional update to ensure we have the latest state
    setRecentMessages(prev => {
      const newRecentMessages = [...prev, messageWithTimestamp];
      console.log('📝 Updated recent messages:', newRecentMessages);
      return newRecentMessages;
    });
    
    setTimeout(() => {
      setRecentMessages(prev => prev.filter(msg => (Date.now() - msg.timestamp) < 10000));
    }, 10000);
  }

  
  const isEchoOfRecentMessage = (content, chatId) => {
    const now = Date.now();
    console.log('🔍 Checking for echo of content:', content, 'in chat:', chatId);
    console.log('🔍 Recent messages:', recentMessages);
    
    const recentMessage = recentMessages.find(msg => 
      msg.text === content && 
      msg.chat_id === chatId &&
      (now - msg.timestamp) < 5000 // Within 5 seconds
    );
    
    console.log('🔍 Found recent message:', recentMessage);
    console.log('🔍 Is echo?', !!recentMessage);
    
    return !!recentMessage;
  }

  // Function to check if content was recently sent by current user (immediate check)
  const isRecentlySentContent = (content, chatId) => {
    const key = `${content}-${chatId}`;
    const hasContent = recentSentContent.has(key);
    console.log('🔍 Checking recently sent content:', { content, chatId, key, hasContent });
    return hasContent;
  }

  // Function to check if a sender ID matches the current user (handles different formats)
  const isSameUser = (senderId, currentUserId) => {
    if (!senderId || !currentUserId) return false;
    
    console.log('🔍 isSameUser check:', { 
      senderId, 
      currentUserId, 
      senderIdType: typeof senderId, 
      currentUserIdType: typeof currentUserId 
    });
    
    // Convert both to strings for comparison
    const senderStr = String(senderId).toLowerCase();
    const currentStr = String(currentUserId).toLowerCase();
    
    // Direct string comparison
    if (senderStr === currentStr) {
      console.log('✅ Direct string match');
      return true;
    }
    
    // If current user ID is numeric, try converting sender ID to number
    if (!isNaN(currentUserId)) {
      const senderNum = parseInt(senderStr, 10);
      if (!isNaN(senderNum) && senderNum === currentUserId) {
        console.log('✅ Numeric conversion match');
        return true;
      }
    }
    
    // If sender ID looks like a hex string, try converting current user ID to hex
    if (senderStr.match(/^[0-9a-f]+$/)) {
      const currentHex = parseInt(currentUserId).toString(16);
      console.log('🔍 Hex comparison:', { senderStr, currentHex, currentUserId });
      if (senderStr === currentHex) {
        console.log('✅ Hex conversion match');
        return true;
      }
      
      // Try reverse: convert hex sender to number
      const senderFromHex = parseInt(senderStr, 16);
      if (!isNaN(senderFromHex) && senderFromHex === currentUserId) {
        console.log('✅ Reverse hex conversion match');
        return true;
      }
      
      // Try converting current user ID to different hex formats
      const currentHexUpper = parseInt(currentUserId).toString(16).toUpperCase();
      if (senderStr.toUpperCase() === currentHexUpper) {
        console.log('✅ Upper case hex conversion match');
        return true;
      }
    }
    
    // Special case: if sender ID is a MongoDB ObjectId format, try to extract numeric part
    if (senderStr.match(/^[0-9a-f]{24}$/)) {
      // This looks like a MongoDB ObjectId, try to extract timestamp or other parts
      const timestampPart = senderStr.substring(0, 8);
      const numericTimestamp = parseInt(timestampPart, 16);
      
      // Compare with current user ID
      if (numericTimestamp === currentUserId) {
        console.log('✅ MongoDB ObjectId timestamp match');
        return true;
      }
    }
    
    console.log('❌ No match found');
    return false;
  }

  // Initialize WebSocket connection only when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      websocketService.connect(currentUser.id)

      // Handle WebSocket messages
      websocketService.onMessage('chat_messages', (data) => {
        const incomingMessages = data.messages || data.items || []
        const chatIdFromPayload = data.chat_id || data.chatId || (incomingMessages[0]?.chat_id)

        // Normalize messages
        const normalized = incomingMessages.map((msg) => ({
          id: msg.id || Date.now() + Math.random(),
          from: msg.sender_id || msg.from || msg.user_id || msg.sender,
          text: msg.content || msg.text || msg.message || '',
          content: msg.content || msg.text || msg.message || '',
          timestamp: msg.timestamp || new Date().toISOString(),
          chat_id: msg.chat_id || chatIdFromPayload || currentChat?.chat_id,
          ...msg,
          text: msg.content || msg.text || msg.message || ''
        }))

        // If payload is for current chat, replace that chat's messages; otherwise, merge safely
        setMessages((previousMessages) => {
          if (chatIdFromPayload) {
            const others = previousMessages.filter(m => m.chat_id !== chatIdFromPayload)
            return [...others, ...normalized]
          }

          // If we don't know chat_id from payload, just append but avoid duplicates
          const seen = new Set()
          const merged = [...previousMessages, ...normalized].filter(m => {
            const key = `${m.chat_id}-${m.id}-${m.timestamp}-${m.text}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          return merged
        })
      })

      websocketService.onMessage('new_message', (data) => {
        
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
          setMessages((previousMessages) => [...previousMessages, newMessage])
        }
      })

      // Handle personal_message type that backend actually sends
      websocketService.onMessage('personal_message', (data) => {
        console.log('📨 Received personal_message from WebSocket:', data);
        
        // Handle both formats: data.message and direct data
        let messageData = data.message || data;
        
        if (messageData) {
          console.log('🔍 Raw messageData:', messageData);
          console.log('🔍 messageData.content:', messageData.content);
          console.log('🔍 messageData.text:', messageData.text);
          console.log('🔍 messageData.message:', messageData.message);
          
          const messageContent = messageData.content || messageData.text || messageData.message;
          console.log('🔍 Extracted messageContent:', messageContent);
          
          const messageChatId = messageData.chat_id || messageData.chatId || currentChat?.chat_id;
          const senderId = messageData.sender_id || messageData.from || messageData.sender;
          const isFromCurrentUser = isSameUser(senderId, currentUser?.id);
          
          console.log('🔍 Personal message analysis:', {
            messageContent,
            messageChatId,
            senderId,
            currentUserId: currentUser?.id,
            isFromCurrentUser
          });
          
          // PRIMARY: Check if this content was recently sent by current user (most reliable)
          if (isRecentlySentContent(messageContent, messageChatId)) {
            console.log('🚫 Blocking personal message with recently sent content');
            return;
          }
          
          // SECONDARY: Check if this is an echo of a recently sent message (content-based)
          if (isEchoOfRecentMessage(messageContent, messageChatId)) {
            console.log('🚫 Blocking personal message as echo of recently sent message (content-based)');
            return;
          }
          
          // TERTIARY: If this is from current user, try to replace optimistic message
          if (isFromCurrentUser) {
            console.log('🔄 Replacing optimistic personal message with server confirmation');
            
            setMessages((previousMessages) => {
              // Find and replace the optimistic message with the same content
              const optimisticIndex = previousMessages.findIndex(msg => 
                msg.isOptimistic && 
                msg.text === messageContent && 
                msg.chat_id === messageChatId &&
                msg.from === currentUser.id
              );
              
              if (optimisticIndex !== -1) {
                // Replace optimistic message with server-confirmed message
                const serverMessage = {
                  id: messageData.id || Date.now(),
                  from: senderId,
                  text: messageContent,
                  content: messageContent,
                  timestamp: messageData.timestamp || new Date().toISOString(),
                  chat_id: messageChatId,
                  isOptimistic: false, // Mark as server-confirmed
                  ...messageData,
                  // Ensure text is not overridden by spread operator
                  text: messageContent
                };
                
                const newMessages = [...previousMessages];
                newMessages[optimisticIndex] = serverMessage;
                console.log('✅ Replaced optimistic personal message with server confirmation');
                // Update chat last message
                updateChatLastMessage(messageChatId, messageContent, serverMessage.timestamp);
                return newMessages;
              }
              
              // If no optimistic message found, ignore this echo
              console.log('🚫 No optimistic personal message found to replace, ignoring echo');
              return previousMessages;
            });
            
            return;
          }
          
          // For messages from other users, add normally
          console.log('✅ Adding personal message from other user to state');
          
          // Check if this message already exists in our state (prevent duplicates)
          setMessages((previousMessages) => {
            // More specific duplicate check: same content, same chat, same sender, within 5 seconds
            const messageExists = previousMessages.some(msg => 
              msg.text === messageContent && 
              msg.chat_id === messageChatId &&
              isSameUser(msg.from, senderId) &&
              Math.abs(new Date(msg.timestamp) - new Date(messageData.timestamp || Date.now())) < 5000 // Within 5 seconds
            );
            
            if (messageExists) {
              return previousMessages;
            }
            
            // Handle message from API docs format
            const newMessage = {
              id: messageData.id || Date.now(),
              from: senderId,
              text: messageContent,
              content: messageContent,
              timestamp: messageData.timestamp || new Date().toISOString(),
              chat_id: messageChatId,
              isOptimistic: false, // Mark as server-confirmed
              ...messageData,
              // Ensure text is not overridden by spread operator
              text: messageContent
            }
            
            console.log('🔍 Created newMessage object:', newMessage);
            console.log('🔍 Final newMessage.text:', newMessage.text);
            
            // Update chat last message
            updateChatLastMessage(messageChatId, messageContent, newMessage.timestamp);
            return [...previousMessages, newMessage];
          });
        } else {
          console.log('❌ No messageData found in personal_message');
        }
      })

      // Handle group_message type that backend is actually sending
      websocketService.onMessage('group_message', (data) => {
        console.log('📨 Received group_message from WebSocket:', data);
        
        // Handle both formats: data.message and direct data
        let messageData = data.data || data.message || data;
        
        if (messageData) {
          console.log('🔍 Raw group messageData:', messageData);
          console.log('🔍 messageData.content:', messageData.content);
          console.log('🔍 messageData.text:', messageData.text);
          console.log('🔍 messageData.message:', messageData.message);
          
          const messageContent = messageData.content || messageData.text || messageData.message;
          console.log('🔍 Extracted group messageContent:', messageContent);
          
          const messageChatId = data.chat_id || messageData.chat_id || messageData.chatId || currentChat?.chat_id;
          
          // Get the sender ID from the message
          const senderId = messageData.sender_id || messageData.sender || messageData.from || messageData.user_id;
          
          // Check if this message is from the current user by comparing sender ID (handle different formats)
          const isFromCurrentUser = isSameUser(senderId, currentUser?.id);
          
          console.log('🔍 Group message analysis:', {
            messageContent,
            messageChatId,
            senderId,
            senderIdType: typeof senderId,
            currentUserId: currentUser?.id,
            currentUserIdType: typeof currentUser?.id,
            isFromCurrentUser,
            recentSentContentSize: recentSentContent.size,
            recentMessagesLength: recentMessages.length
          });
          
          // PRIMARY: Check if this content was recently sent by current user (most reliable)
          const isRecentlySent = isRecentlySentContent(messageContent, messageChatId);
          console.log('🔍 Recently sent check:', { messageContent, messageChatId, isRecentlySent });
          if (isRecentlySent) {
            console.log('🚫 Blocking group message with recently sent content');
            return;
          }
          
          // SECONDARY: Check if this is an echo of a recently sent message (content-based)
          const isEcho = isEchoOfRecentMessage(messageContent, messageChatId);
          console.log('🔍 Echo check:', { messageContent, messageChatId, isEcho });
          if (isEcho) {
            console.log('🚫 Blocking group message as echo of recently sent message (content-based)');
            return;
          }
          
          // TERTIARY: If this is from current user, try to replace optimistic message
          if (isFromCurrentUser) {
            console.log('🔄 Replacing optimistic message with server confirmation');
            
            setMessages((previousMessages) => {
              // Find and replace the optimistic message with the same content
              const optimisticIndex = previousMessages.findIndex(msg => 
                msg.isOptimistic && 
                msg.text === messageContent && 
                msg.chat_id === messageChatId &&
                msg.from === currentUser.id
              );
              
              if (optimisticIndex !== -1) {
                // Replace optimistic message with server-confirmed message
                const serverMessage = {
                  id: messageData.id || Date.now(),
                  from: senderId,
                  text: messageContent,
                  content: messageContent,
                  timestamp: messageData.timestamp || new Date().toISOString(),
                  chat_id: messageChatId,
                  isOptimistic: false, // Mark as server-confirmed
                  ...messageData,
                  // Ensure text is not overridden by spread operator
                  text: messageContent
                };
                
                const newMessages = [...previousMessages];
                newMessages[optimisticIndex] = serverMessage;
                console.log('✅ Replaced optimistic message with server confirmation');
                // Update chat last message
                updateChatLastMessage(messageChatId, messageContent, serverMessage.timestamp);
                return newMessages;
              }
              
              // If no optimistic message found, ignore this echo
              console.log('🚫 No optimistic message found to replace, ignoring echo');
              return previousMessages;
            });
            
            return;
          }
          
          // For messages from other users, add normally
          console.log('✅ Adding group message from other user to state');
          
          // Check if this message already exists in our state (prevent duplicates)
          setMessages((previousMessages) => {
            console.log('🔍 Checking for duplicate group message:', {
              messageContent,
              messageChatId,
              senderId,
              existingMessagesCount: previousMessages.length,
              existingMessagesForThisChat: previousMessages.filter(m => m.chat_id === messageChatId).length
            });
            
            // More specific duplicate check: same content, same chat, same sender, within 5 seconds
            const messageExists = previousMessages.some(msg => 
              msg.text === messageContent && 
              msg.chat_id === messageChatId &&
              isSameUser(msg.from, senderId) &&
              Math.abs(new Date(msg.timestamp) - new Date(messageData.timestamp || Date.now())) < 5000 // Within 5 seconds
            );
            
            console.log('🔍 Duplicate check result:', { messageExists });
            
            if (messageExists) {
              console.log('🚫 Group message already exists in state');
              return previousMessages;
            }
            
            // Handle message from API docs format
            const newMessage = {
              id: messageData.id || Date.now(),
              from: senderId,
              text: messageContent,
              content: messageContent,
              timestamp: messageData.timestamp || new Date().toISOString(),
              chat_id: messageChatId,
              isOptimistic: false, // Mark as server-confirmed
              ...messageData,
              // Ensure text is not overridden by spread operator
              text: messageContent
            }
            
            console.log('🔍 Created group newMessage object:', newMessage);
            console.log('🔍 Final group newMessage.text:', newMessage.text);
            
            // Update chat last message
            updateChatLastMessage(messageChatId, messageContent, newMessage.timestamp);
            return [...previousMessages, newMessage];
          });
        } else {
          console.log('❌ No messageData found in group_message');
        }
      })

      // Handle new_message type as well (in case it's being used)
      websocketService.onMessage('new_message', (data) => {
        
        // Handle both formats: data.message and direct data
        let messageData = data.message || data;
        
        if (messageData) {
          const messageContent = messageData.content || messageData.text;
          const messageChatId = messageData.chat_id;
          const senderId = messageData.sender_id || messageData.from;
          const isFromCurrentUser = isSameUser(senderId, currentUser?.id);
          
          // BLOCK: If this message is from the current user, ignore it completely
          if (isFromCurrentUser) {
            return;
          }
          
          // Handle message from API docs format
          const newMessage = {
            id: Date.now(),
            from: senderId,
            text: messageContent,
            content: messageContent,
            timestamp: messageData.timestamp || new Date().toISOString(),
            chat_id: messageChatId,
            ...messageData,
            // Ensure text is not overridden by spread operator
            text: messageContent
          }
          setMessages((previousMessages) => [...previousMessages, newMessage])
          updateChatLastMessage(messageChatId, messageContent, newMessage.timestamp)
        }
      })
      websocketService.onMessage('new_chat_room', (payload) => {
        const room = payload?.chat_room || payload?.chat || payload
        if (!room) return
        const normalizedRoom = {
          ...room,
          chat_id: room.chat_id || room.id,
          name: room.chat_name || room.name || 'New Chat',
          last_message: room.last_message || '',
        }
        upsertChat(normalizedRoom)
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
    console.log('🔐 ChatContext: Auth state changed', {
      isAuthenticated,
      hasCurrentUser: !!currentUser,
      userId: currentUser?.id,
      username: currentUser?.username,
      hasLoadedChats,
      chatsCount: chats.length
    })
    
    if (isAuthenticated && currentUser && !hasLoadedChats) {
      console.log('✅ ChatContext: User authenticated, loading initial chat list')
      setHasLoadedChats(true)
      loadChatList()
    }
  }, [isAuthenticated, currentUser, hasLoadedChats])
  
  // Reset hasLoadedChats when user changes (different login)
  useEffect(() => {
    console.log('🔄 ChatContext: Current user changed, resetting chat loading state')
    setHasLoadedChats(false)
    setChats([]) // Clear chats when user changes
    setMessages([]) // Clear messages when user changes
  }, [currentUser?.id])

  const loadChatList = async (cursor = null) => {
    if (!isAuthenticated || !currentUser) {
      console.log('🔍 loadChatList: Not authenticated or no current user')
      return
    }

    try {
      console.log('📡 loadChatList: Starting to load chat list', { 
        cursor, 
        userId: currentUser.id,
        userIdType: typeof currentUser.id,
        userIdString: String(currentUser.id),
        username: currentUser.username,
        email: currentUser.email 
      })
      setLoading(true)
      const response = await getChatList(cursor)
      
      console.log('📦 loadChatList: Full API response:', response)
      console.log('📊 loadChatList: Response received', { 
        chatsCount: response.chats?.length || 0, 
        nextCursor: response.next_cursor,
        chatTypes: response.chats?.map(c => ({ 
          id: c.chat_id || c.id, 
          name: c.name || c.chat_name, 
          type: c.type || c.chat_type,
          participants: c.participants 
        }))
      })
      
      // Log each chat for debugging
      response.chats?.forEach((chat, index) => {
        console.log(`💬 Chat ${index + 1}:`, {
          id: chat.chat_id || chat.id,
          name: chat.name || chat.chat_name,
          type: chat.type || chat.chat_type,
          participants: chat.participants,
          isGroup: chat.type === 'group' || chat.chat_type === 'group',
          rawChat: chat
        })
      })
      
      if (cursor) {
        setChats(prev => [...prev, ...(response.chats || [])])
      } else {
        setChats(response.chats || [])
      }
      
      setNextCursor(response.next_cursor || null)
      
    } catch (error) {
      console.error('❌ Error loading chat list:', error)
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

  const loadChatMessages = async (chatId, cursor = null, limit = 50) => {
    if (!chatId) {
      console.log('🔍 loadChatMessages: No chatId provided')
      return
    }

    try {
      console.log('🔍 loadChatMessages: Starting to load messages for chat', { chatId, cursor })
      setLoading(true)
      const response = await getMessageHistory(chatId, cursor, limit)
      
      console.log('🔍 loadChatMessages: Response received', { 
        messagesCount: response.messages?.length || 0,
        chatId 
      })
      
      const raw = response.messages || response.items || []
      const normalized = raw.map((msg) => ({
        id: msg.id || Date.now() + Math.random(),
        from: msg.sender_id || msg.from || msg.user_id || msg.sender,
        text: msg.content || msg.text || msg.message || '',
        content: msg.content || msg.text || msg.message || '',
        timestamp: msg.timestamp || new Date().toISOString(),
        chat_id: msg.chat_id || chatId,
        ...msg,
        text: msg.content || msg.text || msg.message || ''
      }))

      if (cursor) {
        setMessages(prev => {
          const existingForChat = prev.filter(m => m.chat_id === chatId)
          const others = prev.filter(m => m.chat_id !== chatId)
          // Deduplicate by id+timestamp+text
          const combined = [...normalized, ...existingForChat]
          const seen = new Set()
          const deduped = combined.filter(m => {
            const key = `${m.chat_id}-${m.id}-${m.timestamp}-${m.text}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          return [...others, ...deduped]
        })
      } else {
        setMessages(prev => {
          const others = prev.filter(m => m.chat_id !== chatId)
          return [...others, ...normalized]
        })
      }

      // Update per-chat pagination state
      setMessagePagination(prev => ({
        ...prev,
        [chatId]: {
          ...(prev[chatId] || {}),
          cursor: response.next_cursor ?? response.nextCursor ?? null,
          hasMore: response.has_more ?? response.hasMore ?? (normalized.length >= limit),
          isLoading: false,
        }
      }))
      
      console.log('🔍 loadChatMessages: Completed API history load for chat', chatId)
      
    } catch (error) {
      console.error('❌ Error loading chat messages:', error)
      
      // Fallback: Set empty messages array and show error to user
      setMessages(prev => prev.filter(m => m.chat_id !== chatId))
      
      // Show user-friendly error message
      alert(`Unable to load chat history: ${error.message}. Please try again later.`)
      
      setMessagePagination(prev => ({
        ...prev,
        [chatId]: {
          ...(prev[chatId] || {}),
          isLoading: false
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  const loadMoreMessages = async (chatId, limit = 50) => {
    if (!chatId) return
    const state = messagePagination[chatId] || { cursor: null, isLoading: false }
    if (state.isLoading) return
    setMessagePagination(prev => ({
      ...prev,
      [chatId]: { ...(prev[chatId] || {}), isLoading: true }
    }))
    await loadChatMessages(chatId, state.cursor || null, limit)
  }

  const addMessage = (message) => {
    // Generate a unique client message ID for optimistic updates
    const clientMsgId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newMessage = {
      id: clientMsgId, // Use client ID instead of timestamp
      clientMsgId: clientMsgId, // Store the client ID for later replacement
      from: message.from,
      text: message.text,
      content: message.text, 
      timestamp: new Date().toISOString(),
      chat_id: message.chat_id,
      isOptimistic: true, // Mark as optimistic message
      ...message
    }
    
    // Add message to local state immediately (optimistic update)
    setMessages(prev => [...prev, newMessage]);
    
    // Track this content as recently sent to prevent echo
    addToRecentSent(message.text, message.chat_id);
    
    // Add to recent messages for echo detection
    addToRecentMessages(newMessage);
    
    const messageKey = `${message.text}-${message.chat_id}-${Date.now()}`;
    setSentMessages(prev => new Set([...prev, messageKey]));
    
    if (currentChat && currentChat.chat_id) {
      websocketService.sendNewMessage(
        currentChat.chat_id,
        message.text
      )
    } else {
      console.error('No current chat or chat_id - cannot send message');
    }
  }

  const createChat = async (userId, userObject = null) => {
    try {
      if (!userId) {
        throw new Error('Missing user id')
      }
      
      // APPROACH 1: Check if chat already exists first
      console.log('🔍 Checking if chat already exists with user:', userId)
      const existingChat = chats.find(chat => {
        return chat.participants?.includes(String(userId)) || 
               chat.user_id === String(userId) || 
               chat.other_user_id === String(userId) ||
               (chat.username && userObject?.username && chat.username === userObject.username) ||
               (chat.name && userObject?.username && chat.name.includes(userObject.username))
      })
      
      if (existingChat) {
        console.log('🔍 Found existing chat, using it:', existingChat)
        return existingChat
      }
      
      // APPROACH 2: Try creating the chat using the existing API function
      console.log('🔍 No existing chat found, trying to create new one...')
      const participants = Array.from(new Set([String(currentUser?.id), String(userId)].filter(Boolean)))
      const response = await createPersonalChat(participants)
      const newChat = response?.chat || response?.chat_room || response
      if (newChat) {
        const normalizedChat = (typeof newChat === 'string')
          ? {
              chat_id: newChat,
              name: userObject?.username || userObject?.name || `Chat with ${String(userId)}`,
              last_message: '',
              user_id: userId,
              username: userObject?.username,
              email: userObject?.email,
              avatar: userObject?.avatar
            }
          : {
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
      
      // If chat already exists, try to find it in existing chats
      if (error.message === 'CHAT_ALREADY_EXISTS') {
        // Look for existing chat with this user
        const existingChat = chats.find(chat => {
          // Check if this chat is with the target user
          return chat.participants?.includes(userId) || 
                 chat.user_id === userId || 
                 chat.other_user_id === userId ||
                 chat.name === userId // Sometimes the name might be the user ID
        })
        
        if (existingChat) {
          return existingChat
        } else {
          // Create a temporary chat object to navigate to
          const tempChat = {
            chat_id: `temp_${userId}`,
            name: userObject?.username || userObject?.name || `Chat with ${userId}`,
            last_message: '',
            user_id: userId,
            username: userObject?.username,
            email: userObject?.email
          }
          return tempChat
        }
      }
      
      // Surface error to user (single source of alert)
      alert(error.message || 'Invalid data input')
      throw error
    }
  }

  const createGroup = async ({ name, participantIds, adminIds = [] }) => {
    try {
      console.log('👥 createGroup called with:', { name, participantIds, adminIds, currentUser: currentUser?.id })
      
      // Show detailed user ID information for debugging
      console.log('🔍 User ID details:', {
        currentUserId: currentUser?.id,
        currentUserIdType: typeof currentUser?.id,
        currentUserIdString: String(currentUser?.id),
        selectedParticipantIds: participantIds,
        selectedParticipantTypes: participantIds?.map(id => typeof id)
      })
      
      // Ensure creator is included as participant and admin
      const uniqueParticipantIds = Array.from(new Set([currentUser?.id, ...(participantIds || [])].filter(Boolean)))
      const uniqueAdminIds = Array.from(new Set([currentUser?.id, ...(adminIds || [])].filter(Boolean)))

      console.log('📋 createGroup processed participants:', { 
        originalParticipants: participantIds,
        processedParticipants: uniqueParticipantIds,
        processedParticipantTypes: uniqueParticipantIds.map(id => typeof id),
        admins: uniqueAdminIds,
        participantCount: uniqueParticipantIds.length
      })

      if (uniqueParticipantIds.length < 2) {
        throw new Error('Please select at least one participant for the group')
      }

      const response = await createGroupChatAPI(uniqueParticipantIds, name, uniqueAdminIds)
      const newChat = response.chat || response.chat_room || response
      if (newChat) {
        const normalizedChat = {
          ...newChat,
          chat_id: newChat.chat_id || newChat.id,
          name: newChat.chat_name || newChat.name || 'Group',
          last_message: newChat.last_message || ''
        }
        // Upsert to avoid duplicates
        upsertChat(normalizedChat)
        return normalizedChat
      }
      return null
    } catch (error) {
      console.error('Error creating group chat:', error)
      alert(error.message || 'Failed to create group chat')
      return null
    }
  }

  const searchUsers = async (query) => {
    try {
      const response = await searchUsersAPI(query)
      
      // Extract users from the correct field - API returns { items: [...] }
      const users = response.items || response.users || response.data || []
      return users
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  }

  const setCurrentChatUser = (chat) => {
    console.log('🔍 setCurrentChatUser: Setting current chat', { 
      chatId: chat?.chat_id, 
      chatName: chat?.name || chat?.chat_name,
      hasChatId: !!(chat && chat.chat_id)
    })
    
    setCurrentChat(chat)
    if (chat && chat.chat_id) {
      // Load persisted messages first for instant display
      const persistedMessages = loadPersistedMessages(chat.chat_id)
      if (persistedMessages.length > 0) {
        console.log(`📂 Loaded ${persistedMessages.length} persisted messages for instant display`)
        setMessages(prev => {
          const others = prev.filter(m => m.chat_id !== chat.chat_id)
          return [...others, ...persistedMessages]
        })
      }
      
      console.log('🔍 setCurrentChatUser: Requesting old messages via WebSocket for chat', chat.chat_id)
      websocketService.loadChat(chat.chat_id)
      // Initialize pagination state for this chat
      setMessagePagination(prev => ({
        ...prev,
        [chat.chat_id]: { cursor: null, hasMore: true, isLoading: false }
      }))
    } else {
      console.log('🔍 setCurrentChatUser: No chat_id found, clearing messages')
      setMessages([])
    }
  }

  const getMessagesForUser = (chatId) => {
    const filteredMessages = messages.filter(msg => msg.chat_id === chatId)
    return filteredMessages
  }

  const updateUserStatus = (userId, online) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, online } : user
    ))
  }

  const deleteChat = async (chatId) => {
    if (!chatId) return false
    try {
      await deleteChatAPI(chatId)
      setChats(prev => prev.filter(c => (c.chat_id || c.id) !== chatId))
      setMessages(prev => prev.filter(m => m.chat_id !== chatId))
      if (currentChat && (currentChat.chat_id === chatId || currentChat.id === chatId)) {
        setCurrentChat(null)
      }
      return true
    } catch (e) {
      console.error('Failed to delete chat:', e)
      alert(e.message || 'Failed to delete chat')
      return false
    }
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
    createGroup,
    loadChatList,
    loadMoreChats,
    loadChatMessages,
    loadMoreMessages,
    deleteChat,
    setMessages,
    setUsers,
    setChats,
    testBackendEndpoints // Add the test function to the context
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}
