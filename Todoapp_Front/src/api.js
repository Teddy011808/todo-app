// Talks to the NestJS backend in ../Todoapp_Back
const API_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api`

// The API uses "TODO" | "IN_PROGRESS" | "DONE"; the UI (and its CSS classes)
// use "todo" | "in-progress" | "done". Convert at this one boundary.
const toApiStatus = (status) => status.toUpperCase().replace('-', '_')
const fromApiStatus = (status) => status.toLowerCase().replace('_', '-')

// createdAt arrives as an ISO date string; the UI works with milliseconds
const fromApiTodo = (todo) => ({
  ...todo,
  status: fromApiStatus(todo.status),
  createdAt: new Date(todo.createdAt).getTime(),
})

function toApiChanges(changes) {
  return changes.status ? { ...changes, status: toApiStatus(changes.status) } : changes
}

// Access token (15 min) is kept in memory only, never in localStorage.
// The refresh token (7 days) is an HttpOnly cookie that JavaScript cannot read;
// the browser sends it to /api/auth/* and we trade it for a new access token.
let accessToken = null
let onUnauthorized = () => {}
let refreshing = null

function send(path, method, body) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  return fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include', // without this the browser never sends the cookie
  })
}

// Each refresh token works only once, so parallel callers must share one
// refresh: a second one would look like a stolen token and log everyone out.
function refreshAccessToken() {
  refreshing ??= send('/auth/refresh', 'POST')
    .then(async (response) => {
      accessToken = response.ok ? (await response.json()).accessToken : null
      return Boolean(accessToken)
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

async function request(path, method = 'GET', body) {
  let response = await send(path, method, body)
  // Access token expired: get a new one with the cookie and retry once
  if (response.status === 401 && !path.startsWith('/auth/')) {
    if (await refreshAccessToken()) {
      response = await send(path, method, body)
    } else {
      onUnauthorized() // refresh failed too: back to the login page
    }
  }
  if (response.status === 204) return null // DELETE has no body
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message
    throw new Error(message ?? `Request failed (${response.status})`)
  }
  return data
}

export const api = {
  // Auth: POST /api/auth/signup and /api/auth/login
  signup: (email, password) => request('/auth/signup', 'POST', { email, password }),
  login: async (email, password) => {
    accessToken = (await request('/auth/login', 'POST', { email, password })).accessToken
  },
  // On page load: the refresh cookie brings back a fresh access token
  restoreSession: refreshAccessToken,
  // Revokes the refresh tokens on the server and clears the cookie
  logout: async () => {
    await request('/auth/logout', 'POST').catch(() => {})
    accessToken = null
  },
  setOnUnauthorized: (handler) => {
    onUnauthorized = handler
  },

  // Todos: GET, POST, PATCH, DELETE /api/todos
  getTodos: async () => (await request('/todos')).map(fromApiTodo),
  createTodo: async (title, status) =>
    fromApiTodo(await request('/todos', 'POST', { title, status: toApiStatus(status) })),
  updateTodo: async (id, changes) =>
    fromApiTodo(await request(`/todos/${id}`, 'PATCH', toApiChanges(changes))),
  deleteTodo: (id) => request(`/todos/${id}`, 'DELETE'),

  // Bonus endpoints
  bulkStatus: (ids, status) => request('/todos/bulk', 'PATCH', { ids, status: toApiStatus(status) }),
  deleteTodos: (ids) => request('/todos/bulk', 'DELETE', { ids }),
  // Undo: the server keeps deleted todos for a few minutes, so only ids are sent
  restoreTodos: (ids) => request('/todos/restore', 'POST', { ids }),
  reorderTodos: (ids) => request('/todos/order', 'PATCH', { ids }),

  // Profile: { username, displayName, email }
  getProfile: () => request('/profile'),
  updateProfile: (profile) => request('/profile', 'PATCH', profile),
}
