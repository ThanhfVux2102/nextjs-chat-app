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
  
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorData = {};
    try {
      errorData = JSON.parse(errorText);
    } catch {}
    throw new Error(errorData.detail || errorData.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  let chatsRaw = Array.isArray(data.chats) ? data.chats : (Array.isArray(data.items) ? data.items : []);
  const chats = chatsRaw.map((item) => ({
    ...item,
    chat_id: item.chat_id || item.id,
    name: item.name || item.chat_name || item.username || 'Unknown',
    last_message: item.last_message || item.lastMessage || '',
  }));

  return {
    chats,
    next_cursor: data.next_cursor ?? data.next_page ?? null,
  };
}


export async function getMessageHistory(cursor = null) {
  const url = cursor 
    ? `${BASE_URL}/api/message/history?cursor=${encodeURIComponent(cursor)}`
    : `${BASE_URL}/api/message/history`;
  
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to fetch message history');
  }

  return await res.json();
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
