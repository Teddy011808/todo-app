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

async function request(path, method = 'GET', body) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (response.status === 204) return null // DELETE has no body
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message
    throw new Error(message ?? `Request failed (${response.status})`)
  }
  return data
}

export const api = {
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
