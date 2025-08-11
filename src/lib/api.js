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
  const res = await fetch(`${BASE_URL}/api/auth/reset-password?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      new_password: newPassword,
      confirm_password: confirmPassword,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || error.msg || 'Failed to reset password');
  }
  return await res.json();
}

// Check if user has valid session
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

    console.log('Session check status:', res.status)
    
    if (res.ok) {
      const data = await res.json()
      console.log('Session valid:', data)
      return data
    } else {
      console.log('Session invalid or expired')
      return null
    }
  } catch (error) {
    console.error('Error checking session:', error)
    return null
  }
}

// Get chat list with pagination
export async function getChatList(cursor = null) {
  const url = cursor 
    ? `${BASE_URL}/api/chat/me/view?cursor=${encodeURIComponent(cursor)}`
    : `${BASE_URL}/api/chat/me/view`;
  
  console.log('Fetching chat list from:', url)
  console.log('Using credentials:', 'include')
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    console.log('Response status:', res.status)
    console.log('Response headers:', Object.fromEntries(res.headers.entries()))

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Error response text:', errorText)
      
      let errorData = {}
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        console.error('Failed to parse error response as JSON')
      }
      
      throw new Error(errorData.detail || errorData.message || `HTTP ${res.status}: ${res.statusText}`)
    }

    const responseText = await res.text()
    console.log('Raw response text:', responseText)
    
    let data = {}
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      throw new Error(`Invalid JSON response: ${responseText}`)
    }

    console.log('Parsed chat list data:', data)
    return data
  } catch (error) {
    console.error('Error in getChatList:', error)
    throw error
  }
}

// Get message history with pagination
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

// Create personal chat
export async function createPersonalChat(userId) {
  const res = await fetch(`${BASE_URL}/api/chat/create/personal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ user_id: userId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to create personal chat');
  }

  return await res.json();
}

// Search users (you might need to implement this endpoint on backend)
export async function searchUsers(query) {
  const res = await fetch(`${BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Failed to search users');
  }

  return await res.json();
}