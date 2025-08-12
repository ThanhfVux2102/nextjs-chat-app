class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.messageHandlers = new Map();
    this.connectionHandlers = new Map();
  }

  connect() {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://chat-app-backend-3vsf.onrender.com/ws';
    console.log('Attempting WebSocket connection to:', wsUrl);
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected successfully to:', wsUrl);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionHandlers('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket received message:', data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.notifyConnectionHandlers('disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyConnectionHandlers('error', error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
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
      console.log('WebSocket sending message:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('❌ WebSocket not connected - cannot send message');
    }
  }



  loadChat(chatId) {
    console.log('Loading chat messages for chat_id:', chatId);
    this.sendMessage('load_chat', { chat_id: chatId });
  }
  sendNewMessage(chatId, senderId, content) {
    console.log('Sending new message:', { chatId, senderId, content });
    this.sendMessage('new_message', {
      chat_id: chatId,
      data: {
        sender_id: senderId,
        content: content
      }
    });
  }

  onMessage(type, handler) {
    this.messageHandlers.set(type, handler);
  }
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

  notifyConnectionHandlers(event, data = null) {
    const handlers = this.connectionHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}
const websocketService = {
  connect: (userId, url) => getWebSocketInstance(userId).connect(url),
  disconnect: (userId) => getWebSocketInstance(userId).disconnect(),
  send: (userId, type, payload) => getWebSocketInstance(userId).send(type, payload),
  on: (userId, event, handler) => getWebSocketInstance(userId).on(event, handler),

  // 🔹 mới: đăng ký handler trạng thái cho tất cả instance hiện có
  onConnection: (event, handler) => {
    websocketInstances.forEach((instance) => {
      instance.onConnection(event, handler);
    });
  },

  // 🔹 mới: xem trạng thái mọi kết nối
  getConnectionStatus: () => {
    const statuses = {};
    websocketInstances.forEach((instance, userId) => {
      statuses[userId] = instance.getConnectionStatus();
    });
    return statuses;
  },

  // 🔹 tiện debug
  getInstance: (userId) => getWebSocketInstance(userId),
  getAllInstances: () => websocketInstances,
};




const websocketInstances = new Map();

function getWebSocketInstance(userId) {
  let inst = websocketInstances.get(userId);
  if (inst) return inst;

  // tạo instance mới
  const listeners = new Map();           // 'message' | 'error' | ... => Set<fn>
  const connectListeners = new Map();    // 'open' | 'close' | 'error' => Set<fn>
  let socket = null;
  let status = { connected: false, readyState: 0, lastError: null };

  const instApi = {
    connect: (url) => {
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
      socket = new WebSocket(url);
      status.readyState = socket.readyState;

      socket.addEventListener('open', (ev) => {
        status.connected = true;
        status.readyState = socket.readyState;
        (connectListeners.get('open') || new Set()).forEach(fn => fn(ev));
      });

      socket.addEventListener('close', (ev) => {
        status.connected = false;
        status.readyState = socket.readyState;
        (connectListeners.get('close') || new Set()).forEach(fn => fn(ev));
      });

      socket.addEventListener('error', (ev) => {
        status.lastError = ev;
        (listeners.get('error') || new Set()).forEach(fn => fn(ev));
        (connectListeners.get('error') || new Set()).forEach(fn => fn(ev));
      });

      socket.addEventListener('message', (ev) => {
        (listeners.get('message') || new Set()).forEach(fn => fn(ev));
      });
    },

    disconnect: () => { if (socket) socket.close(); },

    send: (type, payload) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type, payload }));
      }
    },

    on: (event, handler) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(handler);
      return () => listeners.get(event)?.delete(handler);
    },

    // 🔹 mới: lắng nghe trạng thái kết nối (open/close/error)
    onConnection: (event, handler) => {
      if (!connectListeners.has(event)) connectListeners.set(event, new Set());
      connectListeners.get(event).add(handler);
      return () => connectListeners.get(event)?.delete(handler);
    },

    // 🔹 mới: trả về trạng thái hiện tại
    getConnectionStatus: () => ({ ...status }),
  };

  websocketInstances.set(userId, instApi);
  return instApi;
}


export default websocketService;
