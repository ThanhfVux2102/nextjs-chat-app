// Environment configuration
export const config = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://chat-app-backend-3vsf.onrender.com',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://chat-app-backend-3vsf.onrender.com/ws',

  // API Endpoints
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    CHAT_LIST: '/api/chat/me/view',
    MESSAGE_HISTORY: '/api/message/history',
    CREATE_PERSONAL_CHAT: '/api/chat/create/personal',
    SEARCH_USERS: '/api/auth/users'
  },

  // WebSocket message types
  WS_MESSAGE_TYPES: {
    LOAD_CHAT: 'load_chat',
    NEW_MESSAGE: 'new_message',
    CHAT_MESSAGES: 'chat_messages'
  }
}

export default config
