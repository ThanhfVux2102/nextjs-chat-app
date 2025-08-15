const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://chat-app-backend-3vsf.onrender.com';

function getAuthToken() {
  try {
    return localStorage.getItem('authToken') || null;
  } catch {
    return null;
  }
}

function defaultHeaders(extra = {}) {
  const token = getAuthToken();
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...extra,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}


export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: defaultHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  const text = await res.text();

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

  // Persist any bearer token fields for cross-site auth fallback
  try {
    const token = data.token || data.access_token || data.jwt || (data.user && data.user.token);
    if (token) localStorage.setItem('authToken', token);
  } catch { }

  return data;
}


export async function register(email, username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: defaultHeaders({ 'Content-Type': 'application/json' }),
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
    headers: defaultHeaders({ 'Content-Type': 'application/json' }),
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
    headers: defaultHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });


  if (res.status === 404) {
    res = await fetch(`${BASE_URL}/api/auth/reset-password?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: defaultHeaders({ 'Content-Type': 'application/json' }),
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
      headers: defaultHeaders(),
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
    headers: defaultHeaders(),
  });



  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ API: getChatList failed with error text:', errorText);
    let errorData = {};
    try {
      errorData = JSON.parse(errorText);
    } catch { }
    throw new Error(errorData.detail || errorData.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();

  let chatsRaw = Array.isArray(data.chats) ? data.chats : (Array.isArray(data.items) ? data.items : []);

  const chats = chatsRaw.map((item) => {
    // Detect group chats using multiple indicators since backend doesn't send type
    const participantCount = Array.isArray(item.participants) ? item.participants.length : 0
    const isGroupByParticipants = participantCount >= 3 // 3+ participants = definitely group
    const isGroupByName = item.name && !item.username && !item.email // Groups have name but no username/email
    const isGroupByType = item.type === 'group' || item.chat_type === 'group'
    const isGroupByField = item.is_group === true || item.isGroup === true

    // More lenient detection: if has custom name (not username) and 2+ participants, likely a group
    const isGroupByNameAndCount = item.name && !item.username && participantCount >= 2 &&
      item.name !== item.email && // name is not just an email
      item.name.length > 2 // has meaningful name

    const isGroup = isGroupByType || isGroupByField || isGroupByParticipants || isGroupByNameAndCount



    return {
      ...item,
      chat_id: item.chat_id || item.id,
      name: item.name || item.chat_name || item.username || 'Unknown',
      last_message: item.last_message || item.lastMessage || '',
      type: isGroup ? 'group' : 'personal', // Set the type based on our detection
      chat_type: isGroup ? 'group' : 'personal',
      isGroup: isGroup,
    }
  });



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



      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: defaultHeaders(),
      });



      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        const errorText = await res.text();
        lastError = new Error(`${endpoint} failed: ${res.status} - ${errorText}`);
      }
    } catch (error) {

      lastError = error;
    }
  }

  // If all endpoints failed, throw the last error
  console.error('🔍 API: All message history endpoints failed');
  throw lastError || new Error('Failed to fetch message history - no working endpoint found');
}


export async function createPersonalChat(participantIds) {

  const normalized = (participantIds || []).map((id) => String(id)).filter(Boolean)



  // Validate that we have exactly 2 participants
  if (normalized.length !== 2) {
    throw new Error(`Personal chat requires exactly 2 participants, got ${normalized.length}: [${normalized.join(', ')}]`)
  }

  // Validate that participants are not the same
  if (normalized[0] === normalized[1]) {
    throw new Error('Cannot create a personal chat with yourself')
  }

  // Remove any undefined values and ensure both IDs are valid
  const validParticipants = normalized.filter(id => id && id !== 'undefined' && id !== 'null')

  if (validParticipants.length !== 2) {
    throw new Error(`Invalid participant IDs: [${normalized.join(', ')}]. Got valid: [${validParticipants.join(', ')}]`)
  }

  // Include both user IDs in participants as requested by user
  const payload = {
    chat_type: 'personal',
    participants: validParticipants
  }



  // Log the request body that will be sent to the server
  const requestBody = JSON.stringify(payload)

  const res = await fetch(`${BASE_URL}/api/chat/create/personal`, {
    method: 'POST',
    headers: defaultHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: requestBody,
  })



  if (res.ok) {
    const text = await res.text()
    // API docs say response is a string (chat ID)
    return text.trim()
  }

  const errorText = await res.text()
  let errorData = {}
  try { errorData = JSON.parse(errorText) } catch { }
  const code = res.status
  let msg = errorData.detail || errorData.message || errorText || `HTTP ${code}`
  if (Array.isArray(errorData?.detail)) {
    msg = errorData.detail
      .map((d) => {
        const loc = Array.isArray(d.loc) ? d.loc.join('.') : (d.loc || '')
        const m = d.msg || d.message || JSON.stringify(d)
        return loc ? `${loc}: ${m}` : m
      })
      .join('\n')
  }
  if (typeof msg !== 'string') {
    try { msg = JSON.stringify(msg) } catch { msg = String(msg) }
  }
  throw new Error(msg)
}

export async function createGroupChat(participantIds, name, adminIds = []) {

  const payload = {
    chat_type: 'group',
    participants: (participantIds || []).map((id) => String(id)),
    name: name,
    admins: (adminIds || []).map((id) => String(id))
  }

  const res = await fetch(`${BASE_URL}/api/chat/create/group`, {
    method: 'POST',
    headers: defaultHeaders({ 'Content-Type': 'application/json' }),
    credentials: 'include',
    body: JSON.stringify(payload),
  })



  if (!res.ok) {
    const errorText = await res.text()
    console.error('❌ API: createGroupChat failed with error text:', errorText)
    let errorData = {}
    try { errorData = JSON.parse(errorText) } catch { }

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


  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
    headers: defaultHeaders(),
  });



  if (!res.ok) {
    const errorText = await res.text();
    console.error('🔍 API: getCurrentUser failed with error text:', errorText)
    let errorData = {};
    try {
      errorData = JSON.parse(errorText);
    } catch { }
    throw new Error(errorData.detail || errorData.message || 'Failed to get current user');
  }

  const data = await res.json();
  return data;
}

export async function searchUsers(query) {


  const candidates = [
    { path: '/api/auth/users', param: 'q' },
    { path: '/api/auth/users/search', param: 'q' },
    { path: '/api/users', param: 'q' },
    { path: '/api/users/search', param: 'q' },
    { path: '/api/auth/user/search', param: 'q' },
    { path: '/api/auth/users', param: 'username' },
    { path: '/api/auth/users', param: 'email' },
  ]

  let lastError = null
  for (const c of candidates) {
    try {
      const url = `${BASE_URL}${c.path}?${encodeURIComponent(c.param)}=${encodeURIComponent(query)}`
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      })



      if (!res.ok) {
        const errorText = await res.text()

        // If any endpoint returns 401, it means authentication failed
        if (res.status === 401) {
          const authError = new Error('Authentication expired. Please log in again.')
          authError.status = 401
          throw authError
        }

        lastError = new Error(`${c.path} -> ${res.status} ${res.statusText}: ${errorText}`)
        continue
      }

      const data = await res.json()

      const list = Array.isArray(data)
        ? data
        : (data.items || data.users || data.data || data.results || [])

      if (!Array.isArray(list)) {
        lastError = new Error('Unexpected user search response shape')
        continue
      }

      // Normalize shape for UI usage
      const normalized = list.map((u) => {
        const backendId = u.id ?? u.user_id ?? u._id ?? u.uid ?? u.uuid ?? null
        return {
          ...u,
          id: backendId, // use only real backend ID; do NOT fall back to username/email
          username: u.username || u.name || u.fullname || u.displayName || u.email || String(backendId || ''),
          email: u.email || u.mail || '',
          avatar: u.avatar || u.photo || u.picture || u.image || '/default-avatar.svg',
        }
      })

      return { items: normalized }
    } catch (err) {
      console.warn('🔍 API: searchUsers endpoint failed:', c.path, err?.message)
      lastError = err
    }
  }

  if (lastError) throw lastError
  return { items: [] }
}

// Test function to check backend connectivity and available endpoints
export async function testBackendEndpoints() {


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

      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: defaultHeaders(),
      });

      results[endpoint] = {
        status: res.status,
        ok: res.ok,
        statusText: res.statusText
      };



    } catch (error) {
      results[endpoint] = {
        error: error.message,
        status: 'ERROR'
      };

    }
  }


  return results;
}
