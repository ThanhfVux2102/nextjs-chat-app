class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageHandlers = new Map();
    this.connectionHandlers = new Map();
    this.currentUserId = null; // Track current user
  }

  connect(userId = null) {
    // Disconnect existing connection if different user
    if (this.currentUserId && this.currentUserId !== userId) {
      this.disconnect();
    }

    if (userId) {
      this.currentUserId = userId;
    }

    // Build WebSocket URL
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsUrl) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      if (apiBase) {
        try {
          const urlObj = new URL(apiBase);
          const wsProtocol = urlObj.protocol === 'https:' ? 'wss:' : 'ws:';
          wsUrl = `${wsProtocol}//${urlObj.host}/ws`;
        } catch {
          wsUrl = 'wss://chat-app-backend-3vsf.onrender.com/ws';
        }
      } else {
        wsUrl = 'wss://chat-app-backend-3vsf.onrender.com/ws';
      }
    }

    // Append bearer token as a fallback auth mechanism if available
    try {
      const token = (typeof localStorage !== 'undefined') ? localStorage.getItem('authToken') : null;
      if (token) {
        const urlWithToken = new URL(wsUrl);
        if (!urlWithToken.searchParams.has('token')) {
          urlWithToken.searchParams.set('token', token);
        }
        wsUrl = urlWithToken.toString();
      }
    } catch { }

    try {
      // Cookie-based auth: just open the WS URL; browser will include cookies for this domain
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionHandlers('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error(`❌ [User: ${this.currentUserId}] Error parsing WebSocket message:`, error);
        }
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        this.notifyConnectionHandlers('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error(`❌ [User: ${this.currentUserId}] WebSocket error:`, error);
        this.notifyConnectionHandlers('error', error);
      };

    } catch (error) {
      console.error(`❌ [User: ${this.currentUserId}] Failed to create WebSocket connection:`, error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;

      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.notifyConnectionHandlers('max_attempts_reached');
    }
  }

  sendMessage(type, data) {
    if (this.isConnected && this.ws) {
      const message = { type, ...data };
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('❌ WebSocket not connected - cannot send message');
    }
  }

  // Load chat messages
  loadChat(chatId) {
    this.sendMessage('load_chat', { chat_id: chatId });
  }

  // Send new message
  sendNewMessage(chatId, content) {
    this.sendMessage('new_message', {
      chat_id: chatId,
      data: {
        content: content
      }
    });
  }

  // Register message handlers
  onMessage(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  // Register connection handlers
  onConnection(event, handler) {
    if (!this.connectionHandlers.has(event)) {
      this.connectionHandlers.set(event, []);
    }
    this.connectionHandlers.get(event).push(handler);
  }

  // Handle incoming messages
  handleMessage(data) {
    // If backend returns a raw array for load_chat, normalize to chat_messages
    if (Array.isArray(data)) {
      const chatId = data[0]?.chat_id;
      const handler = this.messageHandlers.get('chat_messages');
      if (handler) {
        handler({ type: 'chat_messages', chat_id: chatId, messages: data });
      }
      return;
    }

    // Try direct type dispatch first
    const typedHandler = data && data.type ? this.messageHandlers.get(data.type) : null;
    if (typedHandler) {
      typedHandler(data);
      return;
    }

    // Fallback: if payload has messages/items but no type, treat as chat_messages
    if (data && (Array.isArray(data.messages) || Array.isArray(data.items))) {
      const messages = data.messages || data.items || [];
      const chatId = data.chat_id || (messages[0]?.chat_id);
      const handler = this.messageHandlers.get('chat_messages');
      if (handler) {
        handler({ type: 'chat_messages', chat_id: chatId, messages });
      }
    }
  }

  // Notify connection handlers
  notifyConnectionHandlers(event, data = null) {
    const handlers = this.connectionHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create WebSocket instances per user
const websocketInstances = new Map();

// Factory function to get or create WebSocket instance for a user
function getWebSocketInstance(userId) {
  if (!websocketInstances.has(userId)) {
    websocketInstances.set(userId, new WebSocketService());
  }
  return websocketInstances.get(userId);
}

// Default export for backward compatibility (returns instance for current user)
const websocketService = {
  connect: (userId) => {
    if (!userId) {
      console.error('❌ User ID required for WebSocket connection');
      return;
    }
    const instance = getWebSocketInstance(userId);
    instance.connect(userId);
  },
  disconnect: () => {
    // Disconnect all instances
    websocketInstances.forEach((instance, userId) => {
      instance.disconnect();
    });
    websocketInstances.clear();
  },
  sendMessage: (type, data) => {
    // Send to all instances (for testing)
    websocketInstances.forEach((instance, userId) => {
      if (instance.isConnected) {
        instance.sendMessage(type, data);
      }
    });
  },
  sendNewMessage: (chatId, content) => {
    // Send to all instances (for testing)
    websocketInstances.forEach((instance, userId) => {
      if (instance.isConnected) {
        instance.sendNewMessage(chatId, content);
      }
    });
  },
  loadChat: (chatId) => {
    // Load chat for all instances (for testing)
    websocketInstances.forEach((instance, userId) => {
      if (instance.isConnected) {
        instance.loadChat(chatId);
      }
    });
  },
  onMessage: (type, handler) => {
    // Register handler for all instances
    websocketInstances.forEach((instance, userId) => {
      instance.onMessage(type, handler);
    });
  },
  onConnection: (event, handler) => {
    // Register handler for all instances
    websocketInstances.forEach((instance, userId) => {
      instance.onConnection(event, handler);
    });
  },
  getConnectionStatus: () => {
    // Return status of all instances
    const statuses = {};
    websocketInstances.forEach((instance, userId) => {
      statuses[userId] = instance.getConnectionStatus();
    });
    return statuses;
  },
  // Get specific instance for debugging
  getInstance: (userId) => getWebSocketInstance(userId),
  // Get all instances for debugging
  getAllInstances: () => websocketInstances
};

export default websocketService;
