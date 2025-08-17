'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { getChatList, getMessageHistory, createPersonalChat, createGroupChat as createGroupChatAPI, deleteChat as deleteChatAPI, searchUsers as searchUsersAPI, checkSession, getChatMembers } from '@/lib/api'
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
  const [chatMembersByChatId, setChatMembersByChatId] = useState({}) // Cache of members per chat_id

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

  // normalize participants
  const normParticipants = (p) =>
    Array.isArray(p) ? Array.from(new Set(p.map(String).filter(Boolean))).sort() : [];

  // compare 2 rooms
  const isSameRoom = (a, b) => {
    const aId = a.chat_id || a.id;
    const bId = b.chat_id || b.id;
    if (aId && bId && String(aId) === String(bId)) return true;

    const pa = normParticipants(a.participants || a.member_ids);
    const pb = normParticipants(b.participants || b.member_ids);
    if (pa.length && pb.length && pa.length === pb.length) {
      // same participants ⇒ same room
      for (let i = 0; i < pa.length; i++) if (pa[i] !== pb[i]) return false;
      return true;
    }
    return false;
  };

  // generic/placeholder (to avoid downgrade)
  const isGenericName = (n = '') => {
    const s = String(n).trim().toLowerCase();
    return (
      !s ||
      s === 'new chat' ||
      s === 'group' ||
      s === 'personal' ||
      s === 'chat' ||
      /^chat\b/.test(s) ||
      /^[a-f0-9]{24}$/i.test(s)
    );
  };

  // Robustly parse ISO timestamps (with microseconds) or numbers to ms since epoch
  const parseTimestampToMs = (ts) => {
    try {
      if (ts == null) return 0;
      if (typeof ts === 'number') {
        // If seconds (10 digits), convert to ms
        return ts < 1e12 ? Math.floor(ts * 1000) : Math.floor(ts);
      }
      if (typeof ts === 'string') {
        // Trim/normalize fractional seconds to milliseconds
        // Example: 2025-01-01T10:20:30.123456Z -> 2025-01-01T10:20:30.123Z
        const normalized = ts.replace(/(\.\d{3})\d+/, '$1');
        const t = Date.parse(normalized);
        if (!Number.isNaN(t)) return t;
        // Try raw parse as fallback
        const raw = Date.parse(ts);
        if (!Number.isNaN(raw)) return raw;
        const asNum = Number(ts);
        if (!Number.isNaN(asNum)) return asNum < 1e12 ? Math.floor(asNum * 1000) : Math.floor(asNum);
      }
    } catch (_) { }
    return 0;
  };

  // Helper to display chat name, prefer username/email over "Chat with User"
  const displayName = (item) => {
    const nice = item.other_user_username || item.username || item.other_user_email || item.email;
    if (nice) return nice;

    if (item.name && !isGenericName(item.name)) return item.name;

    return item.other_user_id ? `Chat with ${item.other_user_id}` : `Chat ${item.chat_id || ''}`;
  };


  const upsertChat = (incomingRaw) => {
    if (!incomingRaw) return;

    // normalize incoming before merge
    const incoming = {
      ...incomingRaw,
      chat_id: incomingRaw.chat_id || incomingRaw.id,
      participants: normParticipants(incomingRaw.participants || incomingRaw.member_ids),
    };
    const incomingName = incoming.name || incoming.chat_name || incoming.username;

    setChats((prev) => {
      // find room by chat_id or participants
      const idx = prev.findIndex((c) => isSameRoom(c, incoming));
      if (idx !== -1) {
        const existing = prev[idx];
        const existingName = existing.name || existing.chat_name || existing.username;

        const merged = {
          ...existing,
          ...incoming,
          // don't override nice name with generic name
          name: !isGenericName(incomingName) ? incomingName : existingName,
          // keep counterpart fields if they exist
          other_user_id: incoming.other_user_id || existing.other_user_id,
          other_user_username: incoming.other_user_username || existing.other_user_username,
          other_user_email: incoming.other_user_email || existing.other_user_email,
          username: incoming.username || existing.username,
          email: incoming.email || existing.email,
          avatar: incoming.avatar || existing.avatar,
          user_id: incoming.user_id || existing.user_id,
          // always keep normalized participants
          participants: normParticipants(incoming.participants || existing.participants),
        };

        const next = [...prev];
        next[idx] = merged;
        return next;
      }

      // no match ⇒ add new
      return [
        {
          ...incoming,
          participants: normParticipants(incoming.participants),
        },
        ...prev,
      ];
    });
  };


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
      // move updated chat to top (most recent)
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

    // Use functional update to ensure we have the latest state
    setRecentMessages(prev => {
      const newRecentMessages = [...prev, messageWithTimestamp];
      return newRecentMessages;
    });

    setTimeout(() => {
      setRecentMessages(prev => prev.filter(msg => (Date.now() - msg.timestamp) < 10000));
    }, 10000);
  }


  const isEchoOfRecentMessage = (content, chatId) => {
    const now = Date.now();

    const recentMessage = recentMessages.find(msg =>
      msg.text === content &&
      msg.chat_id === chatId &&
      (now - msg.timestamp) < 5000 // Within 5 seconds
    );


    return !!recentMessage;
  }

  // Function to check if content was recently sent by current user (immediate check)
  const isRecentlySentContent = (content, chatId) => {
    const key = `${content}-${chatId}`;
    const hasContent = recentSentContent.has(key);
    return hasContent;
  }

  // Function to check if a sender ID matches the current user (strict string compare)
  const isSameUser = (senderId, currentUserId) => {
    if (senderId == null || currentUserId == null) return false;
    return String(senderId) === String(currentUserId);
  }

  // Initialize WebSocket connection only when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const robustUserId = currentUser?.id ?? currentUser?.user_id ?? currentUser?._id
      if (!robustUserId) {
        console.error('Missing user id in auth state; cannot open WebSocket')
        return
      }
      websocketService.connect(robustUserId)

      // Handle WebSocket messages
      websocketService.onMessage('chat_messages', (data) => {
        const incomingMessages = data.messages || data.items || []
        const chatIdFromPayload = data.chat_id || data.chatId || (incomingMessages[0]?.chat_id)

        // Normalize messages
        const normalized = incomingMessages.map((msg) => {
          const ts = msg.timestamp || new Date().toISOString();
          return {
            // Spread first so our normalized fields below take precedence
            ...msg,
            id: msg.id || Date.now() + Math.random(),
            chat_id: msg.chat_id || chatIdFromPayload || currentChat?.chat_id,
            timestamp: ts,
            timestamp_ms: parseTimestampToMs(ts),
            content: msg.content || msg.text || msg.message || '',
            text: msg.content || msg.text || msg.message || '',
            from: msg.sender_id || msg.from || msg.user_id || msg.sender
          }
        })

        // Replace current chat messages with sorted ascending order
        setMessages((previousMessages) => {
          if (!chatIdFromPayload) return previousMessages
          const others = previousMessages.filter(m => m.chat_id !== chatIdFromPayload)
          const sorted = normalized
            .slice()
            .sort((a, b) => (a.timestamp_ms ?? parseTimestampToMs(a.timestamp)) - (b.timestamp_ms ?? parseTimestampToMs(b.timestamp)))
          return [...others, ...sorted]
        })
      })

      // Intentionally omit 'new_message' handler to avoid duplicate echoes; rely on 'personal_message' / 'group_message'

      // Handle personal_message type that backend actually sends
      websocketService.onMessage('personal_message', (data) => {

        // Handle both formats: data.data (broadcast), data.message and direct data
        let messageData = data.data || data.message || data;

        if (messageData) {
          const messageContent = messageData.content || messageData.text || messageData.message;

          const messageChatId = data.chat_id || messageData.chat_id || messageData.chatId || currentChat?.chat_id;
          const senderId = messageData.sender_id || messageData.from || messageData.sender;
          const isFromCurrentUser = isSameUser(senderId, currentUser?.id);


          // PRIMARY: Check if this content was recently sent by current user (most reliable)
          if (isRecentlySentContent(messageContent, messageChatId)) {
            return;
          }

          // SECONDARY: Check if this is an echo of a recently sent message (content-based)
          if (isEchoOfRecentMessage(messageContent, messageChatId)) {
            return;
          }

          // TERTIARY: If this is from current user, try to replace optimistic message
          if (isFromCurrentUser) {

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
                const _ts = messageData.timestamp || new Date().toISOString();
                const serverMessage = {
                  id: messageData.id || Date.now(),
                  from: senderId,
                  text: messageContent,
                  content: messageContent,
                  timestamp: _ts,
                  timestamp_ms: parseTimestampToMs(_ts),
                  chat_id: messageChatId,
                  isOptimistic: false, // Mark as server-confirmed
                  ...messageData,
                  // Ensure text is not overridden by spread operator
                  text: messageContent
                };

                const newMessages = [...previousMessages];
                newMessages[optimisticIndex] = serverMessage;
                // Update chat last message
                updateChatLastMessage(messageChatId, messageContent, serverMessage.timestamp);
                return newMessages;
              }

              // If no optimistic message found, ignore this echo
              return previousMessages;
            });

            return;
          }

          // For messages from other users, add normally

          // Check if this message already exists in our state (prevent duplicates)
          setMessages((previousMessages) => {
            // More specific duplicate check: same content, same chat, same sender, within 5 seconds
            const messageExists = previousMessages.some(msg => {
              const at = msg.timestamp_ms ?? parseTimestampToMs(msg.timestamp);
              const bt = parseTimestampToMs(messageData.timestamp || Date.now());
              return (
                msg.text === messageContent &&
                msg.chat_id === messageChatId &&
                isSameUser(msg.from, senderId) &&
                Math.abs(at - bt) < 5000 // Within 5 seconds
              );
            });

            if (messageExists) {
              return previousMessages;
            }

            // Handle message from API docs format
            const _ts = messageData.timestamp || new Date().toISOString();
            const newMessage = {
              id: messageData.id || Date.now(),
              from: senderId,
              text: messageContent,
              content: messageContent,
              timestamp: _ts,
              timestamp_ms: parseTimestampToMs(_ts),
              chat_id: messageChatId,
              isOptimistic: false, // Mark as server-confirmed
              ...messageData,
              // Ensure text is not overridden by spread operator
              text: messageContent
            }



            // Update chat last message
            updateChatLastMessage(messageChatId, messageContent, newMessage.timestamp);
            return [...previousMessages, newMessage];
          });
        }
      })

      // Handle group_message type that backend is actually sending
      websocketService.onMessage('group_message', (data) => {

        // Handle both formats: data.message and direct data
        let messageData = data.data || data.message || data;

        if (messageData) {
          const messageContent = messageData.content || messageData.text || messageData.message;

          const messageChatId = data.chat_id || messageData.chat_id || messageData.chatId || currentChat?.chat_id;

          // Get the sender ID from the message
          const senderId = messageData.sender_id || messageData.sender || messageData.from || messageData.user_id;

          // Check if this message is from the current user by comparing sender ID (handle different formats)
          const isFromCurrentUser = isSameUser(senderId, currentUser?.id);


          // PRIMARY: Check if this content was recently sent by current user (most reliable)
          const isRecentlySent = isRecentlySentContent(messageContent, messageChatId);
          if (isRecentlySent) {
            return;
          }

          // SECONDARY: Check if this is an echo of a recently sent message (content-based)
          const isEcho = isEchoOfRecentMessage(messageContent, messageChatId);
          if (isEcho) {
            return;
          }

          // TERTIARY: If this is from current user, try to replace optimistic message
          if (isFromCurrentUser) {

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
                const _ts2 = messageData.timestamp || new Date().toISOString();
                const serverMessage = {
                  id: messageData.id || Date.now(),
                  from: senderId,
                  text: messageContent,
                  content: messageContent,
                  timestamp: _ts2,
                  timestamp_ms: parseTimestampToMs(_ts2),
                  chat_id: messageChatId,
                  isOptimistic: false, // Mark as server-confirmed
                  ...messageData,
                  // Ensure text is not overridden by spread operator
                  text: messageContent
                };

                const newMessages = [...previousMessages];
                newMessages[optimisticIndex] = serverMessage;
                // Update chat last message
                updateChatLastMessage(messageChatId, messageContent, serverMessage.timestamp);
                return newMessages;
              }

              // If no optimistic message found, ignore this echo
              return previousMessages;
            });

            return;
          }

          // For messages from other users, add normally

          // Check if this message already exists in our state (prevent duplicates)
          setMessages((previousMessages) => {
            // More specific duplicate check: same content, same chat, same sender, within 5 seconds
            const messageExists = previousMessages.some(msg => {
              const at = msg.timestamp_ms ?? parseTimestampToMs(msg.timestamp);
              const bt = parseTimestampToMs(messageData.timestamp || Date.now());
              return (
                msg.text === messageContent &&
                msg.chat_id === messageChatId &&
                isSameUser(msg.from, senderId) &&
                Math.abs(at - bt) < 5000 // Within 5 seconds
              );
            });

            if (messageExists) {
              return previousMessages;
            }

            // Handle message from API docs format
            const _ts3 = messageData.timestamp || new Date().toISOString();
            const newMessage = {
              id: messageData.id || Date.now(),
              from: senderId,
              text: messageContent,
              content: messageContent,
              timestamp: _ts3,
              timestamp_ms: parseTimestampToMs(_ts3),
              chat_id: messageChatId,
              isOptimistic: false, // Mark as server-confirmed
              ...messageData,
              // Ensure text is not overridden by spread operator
              text: messageContent
            }



            // Update chat last message
            updateChatLastMessage(messageChatId, messageContent, newMessage.timestamp);
            return [...previousMessages, newMessage];
          });
        }
      })

      // Intentionally omit 'new_message' handler (server broadcasts 'personal_message' or 'group_message')
      websocketService.onMessage('new_chat_room', (payload) => {
        const room = payload?.chat_room || payload?.chat || payload;
        if (!room) return;

        const me = currentUser?.id || currentUser?.user_id || currentUser?._id;

        // Guess participants if WS didn't send them
        const guessedParticipants =
          room.participants ||
          room.member_ids ||
          (room.other_user_id && me ? [String(me), String(room.other_user_id)] : []);

        // Normalize last updated time
        const lastUpd = room.last_updated || room.updated_at || room.last_message_time || new Date().toISOString();

        const normalizedRoom = {
          ...room,
          chat_id: room.chat_id || room.id,
          participants: normParticipants(guessedParticipants),
          name: room.chat_name || room.name || room.username,
          other_user_id: room.other_user_id || undefined,
          other_user_username: room.other_user_username || room.username,
          other_user_email: room.other_user_email || room.email,
          last_message: room.last_message || '',
          last_updated: lastUpd,
          last_updated_ms: parseTimestampToMs(lastUpd),
          // ensure a message time for UI ordering/preview if needed
          last_message_time: room.last_message_time || lastUpd,
        };

        // Hard filter: skip ghost/placeholder rooms
        const hasParticipants = normalizedRoom.participants?.length > 0;
        const hasCounterpart =
          !!(normalizedRoom.other_user_id ||
            normalizedRoom.other_user_username ||
            normalizedRoom.other_user_email);
        const genericName = isGenericName(normalizedRoom.name);
        const hasAnyContent = !!normalizedRoom.last_message;

        if (!hasParticipants && !hasCounterpart && genericName && !hasAnyContent) {
          // No IDs, no participants, generic name → likely a placeholder echo ⇒ ignore
          return;
        }

        upsertChat(normalizedRoom);
      });

      websocketService.onConnection('connected', () => { })

      return () => {
        websocketService.disconnect()
      }
    }
  }, [isAuthenticated, currentUser])
  useEffect(() => {
    if (isAuthenticated && currentUser && !hasLoadedChats) {
      setHasLoadedChats(true)
      loadChatList()
    }
  }, [isAuthenticated, currentUser, hasLoadedChats])

  // Reset state when user changes (different login)
  useEffect(() => {
    setHasLoadedChats(false)
    setChats([])
    setMessages([])
    setRecentSentContent(new Set())
    setRecentMessages([])
    setSentMessages(new Set())
    setCurrentChat(null)
    setChatMembersByChatId({})
  }, [currentUser?.id])

  const loadChatList = async (cursor = null) => {
    if (!isAuthenticated || !currentUser) {
      return
    }

    try {
      setLoading(true)
      const response = await getChatList(cursor)
      const items = response.chats || []

      // normalize minimum to ensure upsert works correctly
      items.forEach((raw) => {
        const normalized = {
          ...raw,
          chat_id: raw.chat_id || raw.id,
          participants: normParticipants(raw.participants || raw.member_ids),
          name: raw.chat_name || raw.name || raw.username,
          other_user_id: raw.other_user_id || undefined,
          other_user_username: raw.other_user_username || raw.username,
          other_user_email: raw.other_user_email || raw.email,
          last_message: raw.last_message || '',
        }
        upsertChat(normalized) // use merge/dedupe mechanism
      })

      setNextCursor(response.next_cursor || null)

    } catch (error) {
      console.error('❌ Error loading chat list:', error)
      // don't setChats ([]) anymore to avoid clearing the current state
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
      return
    }

    try {
      setLoading(true)
      const response = await getMessageHistory(chatId, cursor, limit)

      const raw = response.messages || response.items || []
      const normalized = raw.map((msg) => ({
        id: msg.id || Date.now() + Math.random(),
        from: msg.sender_id || msg.from || msg.user_id || msg.sender,
        text: msg.content || msg.text || msg.message || '',
        content: msg.content || msg.text || msg.message || '',
        timestamp: msg.timestamp || new Date().toISOString(),
        timestamp_ms: parseTimestampToMs(msg.timestamp || new Date().toISOString()),
        chat_id: msg.chat_id || chatId,
        ...msg,
        text: msg.content || msg.text || msg.message || ''
      }))

      // Compute a fallback next cursor using the oldest timestamp across current and newly fetched messages
      const existingForChatNow = messages.filter(m => m.chat_id === chatId)
      const oldestExistingTs = existingForChatNow.reduce((min, m) => {
        const t = m.timestamp_ms ?? parseTimestampToMs(m.timestamp)
        return (t >= 0 && t < min) ? t : min
      }, Number.POSITIVE_INFINITY)
      const oldestFetchedTs = normalized.reduce((min, m) => {
        const t = m.timestamp_ms ?? parseTimestampToMs(m.timestamp)
        return (t >= 0 && t < min) ? t : min
      }, Number.POSITIVE_INFINITY)
      const fallbackNextCursorCandidate = Math.min(oldestExistingTs, oldestFetchedTs)
      const fallbackExclusive = Number.isFinite(fallbackNextCursorCandidate)
        ? Math.max(0, fallbackNextCursorCandidate - 1)
        : null

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
          const existingForChat = prev.filter(m => m.chat_id === chatId)
          const others = prev.filter(m => m.chat_id !== chatId)
          const combined = [...existingForChat, ...normalized]
          const seen = new Set()
          const deduped = combined.filter(m => {
            const key = `${m.chat_id}-${m.id}-${m.timestamp}-${m.text}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          return [...others, ...deduped]
        })
      }

      // Update per-chat pagination state
      const nextCursor = (response.next_cursor ?? response.nextCursor ?? fallbackExclusive)
      const serverHasMore = (response.has_more ?? response.hasMore)
      const computedHasMore = (typeof serverHasMore === 'boolean')
        ? serverHasMore
        : (nextCursor !== null || normalized.length >= limit)

      setMessagePagination(prev => ({
        ...prev,
        [chatId]: {
          ...(prev[chatId] || {}),
          cursor: nextCursor,
          hasMore: computedHasMore,
          isLoading: false,
        }
      }))



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
    const state = messagePagination[chatId] || { cursor: null, isLoading: false, hasMore: true }
    if (state.isLoading || state.hasMore === false) {
      return
    }
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
      timestamp_ms: Date.now(),
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
      const existingChat = chats.find(chat => {
        return chat.participants?.includes(String(userId)) ||
          chat.user_id === String(userId) ||
          chat.other_user_id === String(userId) ||
          (chat.username && userObject?.username && chat.username === userObject.username) ||
          (chat.name && userObject?.username && chat.name.includes(userObject.username))
      })

      if (existingChat) {
        return existingChat
      }

      // APPROACH 2: Try creating the chat using the existing API function

      // Also check localStorage directly
      let localStorageUser = null
      try {
        const stored = localStorage.getItem('chatUser')
        if (stored) {
          localStorageUser = JSON.parse(stored)
        }
      } catch (e) {
        console.error('🔍 DEBUG: Error reading localStorage:', e)
      }

      // Get current user ID with fallbacks
      const currentUserId = currentUser?.id || currentUser?.user_id || currentUser?._id || localStorageUser?.id || localStorageUser?.user_id || localStorageUser?._id

      if (!currentUserId) {
        throw new Error('Current user ID is not available. Please log in again.')
      }

      const participants = Array.from(new Set([String(currentUserId), String(userId)].filter(Boolean)))
      const response = await createPersonalChat(participants)
      const newChat = response?.chat || response?.chat_room || response
      console.log('🔍 DEBUG: createChat response:', { response, newChat, userObject })
      if (newChat) {
        const normalizedChat = (typeof newChat === 'string')
          ? {
            chat_id: newChat,
            participants,
            other_user_id: String(userId),
            other_user_username: userObject?.username || userObject?.name,
            other_user_email: userObject?.email,
            avatar: userObject?.avatar,
            name: userObject?.username || userObject?.name || '',
            last_message: '',
            user_id: userId,
            username: userObject?.username,
            email: userObject?.email
          }
          : {
            ...newChat,
            chat_id: newChat.chat_id || newChat.id,
            participants: newChat.participants || newChat.member_ids || participants,
            other_user_id: newChat.other_user_id || String(userId),
            other_user_username: userObject?.username || newChat.other_user_username || newChat.username,
            other_user_email: userObject?.email || newChat.other_user_email || newChat.email,
            avatar: userObject?.avatar || newChat.avatar,
            name: newChat.chat_name || newChat.name || (userObject?.username || ''),
            last_message: newChat.last_message || '',
            user_id: userId,
            username: userObject?.username,
            email: userObject?.email
          }
        console.log('🔍 DEBUG: normalizedChat:', normalizedChat)
        // Use upsertChat to avoid duplicates
        upsertChat(normalizedChat)
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

      // Ensure creator is included as participant and admin
      const uniqueParticipantIds = Array.from(new Set([currentUser?.id, ...(participantIds || [])].filter(Boolean)))
      const uniqueAdminIds = Array.from(new Set([currentUser?.id, ...(adminIds || [])].filter(Boolean)))



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
    // Clear messages for the new current chat immediately to avoid stale render from previous account
    if (chat?.chat_id || chat?.id) {
      const cidTmp = chat.chat_id || chat.id
      setMessages(prev => prev.filter(m => m.chat_id !== cidTmp))
    }

    setCurrentChat(chat)
    const cid = chat?.chat_id || chat?.id
    if (cid) {
      // Load persisted messages first for instant display
      const persistedMessages = loadPersistedMessages(cid)
      if (persistedMessages.length > 0) {
        // Normalize persisted messages for ownership correctness
        const normalizedPersisted = persistedMessages.map(msg => ({
          ...msg,
          chat_id: msg.chat_id || cid,
          content: msg.content || msg.text || '',
          text: msg.content || msg.text || '',
          from: msg.from || msg.sender_id || msg.user_id || msg.sender,
          timestamp_ms: msg.timestamp_ms ?? parseTimestampToMs(msg.timestamp)
        }))

        setMessages(prev => {
          const others = prev.filter(m => m.chat_id !== cid)
          return [...others, ...normalizedPersisted]
        })
      }

      websocketService.loadChat(cid)
      // Initialize pagination state for this chat
      setMessagePagination(prev => ({
        ...prev,
        [cid]: { cursor: null, hasMore: true, isLoading: true }
      }))

      // Kick off initial page load (first 50)
      loadChatMessages(cid, null, 50)

        // Attempt to fetch members for this chat (useful for group chats)
        ; (async () => {
          try {
            const res = await getChatMembers(cid)
            const items = res.items || []
            if (Array.isArray(items) && items.length > 0) {
              setChatMembersByChatId(prev => ({ ...prev, [cid]: items }))
            }
          } catch (e) {
            // Silently ignore; UI will fallback to generic labels
            console.warn('Failed to fetch chat members:', e?.message)
          }
        })()
    } else {
      setMessages([])
    }
  }

  // Resolve a user-friendly display for a given user id within a chat
  const getDisplayForUser = (userId, chatId) => {
    if (!userId || !chatId) return null
    const list = chatMembersByChatId[chatId] || []
    const match = list.find(u => String(u.id) === String(userId))
    if (match) {
      const label = match.username || match.email
      if (label && typeof label === 'string' && label.trim()) return label
    }
    return null
  }

  const getMessagesForUser = (chatId) => {
    const filteredMessages = messages.filter(msg => msg.chat_id === chatId)
    // Sort ascending by timestamp (older first)
    return filteredMessages.slice().sort((a, b) => {
      const at = a.timestamp_ms ?? parseTimestampToMs(a.timestamp)
      const bt = b.timestamp_ms ?? parseTimestampToMs(b.timestamp)
      if (at !== bt) return at - bt
      // Stable fallback by id to reduce jitter if timestamps equal
      return String(a.id).localeCompare(String(b.id))
    })
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
    // Helper to check if a senderId belongs to current user (handles different formats)
    isMessageFromCurrentUser: (senderId) => isSameUser(senderId, currentUser?.id),
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
    displayName, // Add the displayName helper function
    // Members helpers
    chatMembersByChatId,
    getDisplayForUser,
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}
