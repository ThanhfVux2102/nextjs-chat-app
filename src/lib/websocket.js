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
      console.log(`🔄 [User: ${this.currentUserId}] Disconnecting previous user connection`);
      this.disconnect();
    }
    
    if (userId) {
      this.currentUserId = userId;
    }
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://chat-app-backend-3vsf.onrender.com/ws';
    console.log(`🔌 [User: ${this.currentUserId}] Attempting WebSocket connection to:`, wsUrl);
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log(`✅ [User: ${this.currentUserId}] WebSocket connected successfully to:`, wsUrl);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionHandlers('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`📨 [User: ${this.currentUserId}] WebSocket received message:`, data);
          this.handleMessage(data);
        } catch (error) {
          console.error(`❌ [User: ${this.currentUserId}] Error parsing WebSocket message:`, error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 [User: ${this.currentUserId}] WebSocket disconnected:`, event.code, event.reason);
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
      console.log(`🔌 [User: ${this.currentUserId}] Disconnecting WebSocket`);
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
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
      console.log('📤 WebSocket sending message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('❌ WebSocket not connected - cannot send message');
    }
  }

  // Load chat messages
  loadChat(chatId) {
    console.log('📤 Loading chat messages for chat_id:', chatId);
    this.sendMessage('load_chat', { chat_id: chatId });
  }

  // Send new message
  sendNewMessage(chatId, senderId, content) {
    console.log('📤 Sending new message:', { chatId, senderId, content });
    this.sendMessage('new_message', {
      chat_id: chatId,
      data: {
        sender_id: senderId,
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
    const handler = this.messageHandlers.get(data.type);
    if (handler) {
      handler(data);
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
    console.log(`🏭 Creating new WebSocket instance for user: ${userId}`);
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
      console.log(`🔌 Disconnecting WebSocket for user: ${userId}`);
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
  sendNewMessage: (chatId, senderId, content) => {
    // Send to all instances (for testing)
    websocketInstances.forEach((instance, userId) => {
      if (instance.isConnected) {
        instance.sendNewMessage(chatId, senderId, content);
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
