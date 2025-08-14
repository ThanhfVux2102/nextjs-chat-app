const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://chat-app-backend-3vsf.onrender.com';


export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const text = await res.text();
  console.log('Raw response:', text);

  let data = {};
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`Invalid JSON from server. Raw response: ${text}`);
  }

  if (!res.ok || data.error || data.detail) {
    const msg = data.detail || data.message || data.error || `Status ${res.status}`;
    throw new Error(msg);
  }

  return data;
}


export async function register(email, username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return await res.json();
}


export async function forgotPassword(email) {
  const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.detail || 'Failed to send reset link')
  }

  return await res.json()
}

export async function resetPassword(token, newPassword, confirmPassword) {
 const payload = {
    new_password: newPassword,
    confirm_password: confirmPassword,
  };


  let res = await fetch(`${BASE_URL}/api/auth/reset-password/${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

 
  if (res.status === 404) {
    res = await fetch(`${BASE_URL}/api/auth/reset-password?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || error.msg || 'Failed to reset password');
  }
  return await res.json();
}

export async function checkSession() {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    if (res.ok) {
      return await res.json();
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}


export async function getChatList(cursor = null) {
  const url = cursor 
    ? `${BASE_URL}/api/chat/me/view?cursor=${encodeURIComponent(cursor)}`
    : `${BASE_URL}/api/chat/me/view`;
  
  console.log('🔍 API: getChatList called with URL:', url);
  
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  });

  console.log('🔍 API: getChatList response status:', res.status);

  if (!res.ok) {
    const errorText = await res.text();
    console.error('🔍 API: getChatList failed with error text:', errorText);
    let errorData = {};
    try {
      errorData = JSON.parse(errorText);
    } catch {}
    throw new Error(errorData.detail || errorData.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  console.log('🔍 API: getChatList raw response:', data);
  
  let chatsRaw = Array.isArray(data.chats) ? data.chats : (Array.isArray(data.items) ? data.items : []);
  console.log('🔍 API: getChatList chatsRaw:', chatsRaw);
  
  const chats = chatsRaw.map((item) => ({
    ...item,
    chat_id: item.chat_id || item.id,
    name: item.name || item.chat_name || item.username || 'Unknown',
    last_message: item.last_message || item.lastMessage || '',
  }));

  console.log('🔍 API: getChatList processed chats:', chats);

  return {
    chats,
    next_cursor: data.next_cursor ?? data.next_page ?? null,
  };
}


export async function getMessageHistory(chatId = null, cursor = null, limit = 50) {
  
  const possibleEndpoints = [
    `/api/message/history`,
    `/api/messages/history`,
    `/api/chat/${chatId}/messages`,
    `/api/messages`,
    `/api/chat/messages`
  ];
  
  let lastError = null;
  
  for (const endpoint of possibleEndpoints) {
    try {
      let url = `${BASE_URL}${endpoint}`;
      const params = new URLSearchParams();
      
      if (chatId && !endpoint.includes('${chatId}')) {
        params.append('chat_id', chatId);
      }
      
      if (cursor) {
        params.append('cursor', cursor);
      }
      if (limit) {
        params.append('limit', String(limit));
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      console.log('🔍 API: getMessageHistory trying endpoint:', url);
      
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      console.log('🔍 API: getMessageHistory response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('🔍 API: getMessageHistory successful with endpoint:', endpoint, {
          messagesCount: data.messages?.length || 0,
          chatId,
          cursor
        });
        return data;
      } else {
        const errorText = await res.text();
        console.log('🔍 API: getMessageHistory failed with endpoint:', endpoint, 'Status:', res.status, 'Error:', errorText);
        lastError = new Error(`${endpoint} failed: ${res.status} - ${errorText}`);
      }
    } catch (error) {
      console.log('🔍 API: getMessageHistory error with endpoint:', endpoint, error.message);
      lastError = error;
    }
  }
  
  // If all endpoints failed, throw the last error
  console.error('🔍 API: All message history endpoints failed');
  throw lastError || new Error('Failed to fetch message history - no working endpoint found');
}


export async function createPersonalChat(userId) {
  console.log('🔍 API: createPersonalChat called with userId:', userId)
  console.log('🔍 API: Making request to:', `${BASE_URL}/api/chat/create/personal`)
  console.log('🔍 API: Request body:', { user_id: userId })
  
  const res = await fetch(`${BASE_URL}/api/chat/create/personal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ user_id: userId }),
  });

  console.log('🔍 API: createPersonalChat response status:', res.status)
  console.log('🔍 API: createPersonalChat response ok:', res.ok)

  if (!res.ok) {
    const errorText = await res.text();
    console.error('🔍 API: createPersonalChat failed with error text:', errorText)
    let errorData = {};
    try {
      errorData = JSON.parse(errorText);
      console.error('🔍 API: Parsed error data:', errorData)
    } catch (e) {
      console.error('🔍 API: Could not parse error as JSON:', e)
    }
    
    // For 422 errors, the chat might already exist - let's try to find it
    if (res.status === 422) {
      console.log('🔍 API: 422 error - chat might already exist, trying to find existing chat')
      // We'll handle this in the ChatContext
      throw new Error('CHAT_ALREADY_EXISTS')
    }
    
    throw new Error(errorData.detail || errorData.message || `Failed to create personal chat (${res.status})`);
  }

  const data = await res.json();
  console.log('🔍 API: createPersonalChat successful, data:', data)
  return data;
}

export async function createGroupChat(participantIds, name, adminIds = []) {
  console.log('🔍 API: createGroupChat called with', { participantIds, name, adminIds })
  const payload = {
    chat_type: 'group',
    participants: (participantIds || []).map((id) => String(id)),
    name: name,
    admins: (adminIds || []).map((id) => String(id))
  }

  const res = await fetch(`${BASE_URL}/api/chat/create/group`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  console.log('🔍 API: createGroupChat response status:', res.status)

  if (!res.ok) {
    const errorText = await res.text()
    console.error('🔍 API: createGroupChat failed with error text:', errorText)
    let errorData = {}
    try { errorData = JSON.parse(errorText) } catch {}

    // Format fastapi-style validation errors for readability
    let message = errorData.message || errorData.detail || ''
    if (Array.isArray(errorData?.detail)) {
      message = errorData.detail
        .map((d) => {
          const loc = Array.isArray(d.loc) ? d.loc.join('.') : d.loc
          const msg = d.msg || d.message || JSON.stringify(d)
          return loc ? `${loc}: ${msg}` : msg
        })
        .join('\n')
    }
    if (!message || typeof message !== 'string') {
      message = `Failed to create group chat (${res.status})`
    }
    throw new Error(message)
  }

  const data = await res.json()
  console.log('🔍 API: createGroupChat successful, data:', data)
  return data
}

export async function deleteChat(chatId) {
  const endpoints = [
    { method: 'DELETE', url: `${BASE_URL}/api/chat/${encodeURIComponent(chatId)}`, body: null },
    { method: 'DELETE', url: `${BASE_URL}/api/chats/${encodeURIComponent(chatId)}`, body: null },
    { method: 'DELETE', url: `${BASE_URL}/api/chat/delete/${encodeURIComponent(chatId)}`, body: null },
    { method: 'POST', url: `${BASE_URL}/api/chat/delete`, body: { chat_id: String(chatId) } },
  ]

  let lastError = null
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: ep.method,
        credentials: 'include',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: ep.body ? JSON.stringify(ep.body) : null,
      })

      if (res.ok) {
        // Some APIs return empty body on DELETE
        try {
          const data = await res.json()
          return data || { ok: true }
        } catch {
          return { ok: true }
        }
      } else {
        const text = await res.text()
        lastError = new Error(text || `Failed to delete chat (${res.status})`)
      }
    } catch (e) {
      lastError = e
    }
  }
  throw lastError || new Error('Failed to delete chat')
}

export async function getCurrentUser() {
  console.log('🔍 API: Getting current user from /api/auth/me')
  
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  });

  console.log('🔍 API: getCurrentUser response status:', res.status)
  console.log('🔍 API: getCurrentUser response ok:', res.ok)

  if (!res.ok) {
    const errorText = await res.text();
    console.error('🔍 API: getCurrentUser failed with error text:', errorText)
    let errorData = {};
    try {
      errorData = JSON.parse(errorText);
    } catch {}
    throw new Error(errorData.detail || errorData.message || 'Failed to get current user');
  }

  const data = await res.json();
  console.log('🔍 API: getCurrentUser successful, data:', data)
  return data;
}

export async function searchUsers(query) {
  console.log('🔍 API: searchUsers called with query:', query)
  console.log('🔍 API: Making request to:', `${BASE_URL}/api/auth/users?q=${encodeURIComponent(query)}`)
  
  const res = await fetch(`${BASE_URL}/api/auth/users?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  });

  console.log('🔍 API: Response status:', res.status)
  console.log('🔍 API: Response ok:', res.ok)

  if (!res.ok) {
    const errorText = await res.text();
    console.error('🔍 API: Search failed with error text:', errorText)
    let errorData = {};
    try {
      errorData = JSON.parse(errorText);
    } catch {}
    throw new Error(errorData.detail || errorData.message || 'Failed to search users');
  }

  const data = await res.json();
  console.log('🔍 API: Search successful, data:', data)
  return data;
}

// Test function to check backend connectivity and available endpoints
export async function testBackendEndpoints() {
  console.log('🔍 API: Testing backend connectivity...')
  
  const testEndpoints = [
    '/api/auth/me',
    '/api/chat/me/view',
    '/api/message/history',
    '/api/messages/history',
    '/api/messages',
    '/api/chat/messages'
  ];
  
  const results = {};
  
  for (const endpoint of testEndpoints) {
    try {
      const url = `${BASE_URL}${endpoint}`;
      console.log('🔍 API: Testing endpoint:', url);
      
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      results[endpoint] = {
        status: res.status,
        ok: res.ok,
        statusText: res.statusText
      };
      
      console.log('🔍 API: Endpoint result:', endpoint, results[endpoint]);
      
    } catch (error) {
      results[endpoint] = {
        error: error.message,
        status: 'ERROR'
      };
      console.log('🔍 API: Endpoint error:', endpoint, error.message);
    }
  }
  
  console.log('🔍 API: All endpoint test results:', results);
  return results;
}
