import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import Header from './components/Header'
import Hero from './components/Hero'
import ProfilePage from './components/ProfilePage'
import TodoForm from './components/TodoForm'
import TodoToolbar from './components/TodoToolbar'
import TodoList from './components/TodoList'
import BulkBar from './components/BulkBar'
import Toast from './components/Toast'
import './App.css'

function App() {
  // Data comes from the NestJS backend. Changes show up right away and are
  // saved in the background; if saving fails we reload from the server.
  const [user, setUser] = useState(null)
  const [todos, setTodos] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [activeTab, setActiveTab] = useState('todos')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [toast, setToast] = useState(null)

  // Read: fetch the profile and todos from the server
  const loadData = useCallback(
    () =>
      Promise.all([api.getProfile(), api.getTodos()]).then(
        ([profile, serverTodos]) => {
          setUser(profile)
          setTodos(serverTodos)
          setLoadError(null)
        },
        (error) => setLoadError(error.message),
      ),
    [],
  )

  useEffect(() => {
    loadData()
  }, [loadData])

  // Run a save request; on failure show the error and reload the real data
  const save = useCallback(
    async (request) => {
      try {
        return await request
      } catch (error) {
        setToast({ message: `Could not save: ${error.message}` })
        loadData()
      }
    },
    [loadData],
  )

  // Hide the toast after 5 seconds
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  // Read: what the list shows after the filter and search are applied
  const visibleTodos = todos.filter((todo) => {
    const matchesFilter =
      filter === 'all' || (filter === 'starred' ? todo.starred : todo.status === filter)
    const matchesSearch = todo.title.toLowerCase().includes(search.trim().toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Create (wait for the server so the todo gets its real id)
  async function addTodo(title, status) {
    const newTodo = await save(api.createTodo(title, status))
    if (newTodo) setTodos((prev) => [newTodo, ...prev])
  }

  // Update (title, status or starred)
  function updateTodo(id, changes) {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, ...changes } : todo)))
    save(api.updateTodo(id, changes))
  }

  // Delete one or many, remembering their positions so they can be restored with Undo
  function deleteTodos(ids) {
    const removed = todos.flatMap((todo, index) => (ids.includes(todo.id) ? [{ todo, index }] : []))
    setTodos((prev) => prev.filter((todo) => !ids.includes(todo.id)))
    setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
    // One todo: DELETE /api/todos/:id, several: DELETE /api/todos/bulk
    const deleting = save(ids.length === 1 ? api.deleteTodo(ids[0]) : api.deleteTodos(ids))
    setToast({
      message:
        removed.length === 1 ? `Deleted "${removed[0].todo.title}"` : `Deleted ${removed.length} tasks`,
      onUndo: () => {
        setTodos((prev) => {
          const next = [...prev]
          removed.forEach(({ todo, index }) => next.splice(index, 0, todo))
          return next
        })
        setToast(null)
        // Wait for the delete to finish so the server has something to restore
        deleting.then(() => save(api.restoreTodos(removed.map(({ todo }) => todo.id))))
      },
    })
  }

  // Drag and drop: move the dragged todo to where the target todo is
  function moveTodo(dragId, targetId) {
    if (dragId === targetId) return
    const next = [...todos]
    const from = next.findIndex((todo) => todo.id === dragId)
    const [moved] = next.splice(from, 1)
    const to = next.findIndex((todo) => todo.id === targetId)
    // Dragging down drops after the target, dragging up drops before it
    next.splice(from <= to ? to + 1 : to, 0, moved)
    setTodos(next)
    save(api.reorderTodos(next.map((todo) => todo.id)))
  }

  // Multi-select
  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id],
    )
  }

  const allVisibleSelected =
    visibleTodos.length > 0 && visibleTodos.every((todo) => selectedIds.includes(todo.id))

  function toggleSelectAll() {
    setSelectedIds(allVisibleSelected ? [] : visibleTodos.map((todo) => todo.id))
  }

  function bulkChangeStatus(status) {
    const count = selectedIds.length
    setTodos((prev) =>
      prev.map((todo) => (selectedIds.includes(todo.id) ? { ...todo, status } : todo)),
    )
    setSelectedIds([])
    save(api.bulkStatus(selectedIds, status))
    const label = status === 'todo' ? 'To Do' : status === 'in-progress' ? 'In Progress' : 'Done'
    setToast({ message: `Moved ${count} task${count === 1 ? '' : 's'} to ${label}` })
  }

  function clearFilters() {
    setFilter('all')
    setSearch('')
  }

  function saveProfile(profile) {
    setUser(profile)
    // Keep what the server saved (it trims and validates)
    save(api.updateProfile(profile)).then((saved) => saved && setUser(saved))
  }

  if (!user) {
    return (
      <div className="app">
        <main className="container">
          <div className="card empty">
            {loadError ? (
              <>
                <h3>Can't reach the server</h3>
                <p>{loadError}. Is the backend running? (cd Todoapp_Back &amp;&amp; npm run start:dev)</p>
                <button className="btn small" onClick={loadData}>
                  Try again
                </button>
              </>
            ) : (
              <p>Loading…</p>
            )}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <Header user={user} activeTab={activeTab} onTabChange={setActiveTab} todoCount={todos.length} />

      <main className="container">
        {activeTab === 'todos' ? (
          <section id="panel-todos" role="tabpanel" aria-labelledby="tab-todos" className="page">
            <Hero username={user.displayName} todos={todos} />
            <TodoForm onAdd={addTodo} />

            <div className="card list-card">
              <TodoToolbar
                todos={todos}
                visibleCount={visibleTodos.length}
                filter={filter}
                onFilterChange={setFilter}
                search={search}
                onSearchChange={setSearch}
                allVisibleSelected={allVisibleSelected}
                onToggleSelectAll={toggleSelectAll}
              />
              <TodoList
                todos={visibleTodos}
                hasAnyTodos={todos.length > 0}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onUpdate={updateTodo}
                onDelete={(id) => deleteTodos([id])}
                onMove={moveTodo}
                onClearFilters={clearFilters}
              />
            </div>

            <p className="shortcuts">
              <span><kbd>N</kbd> new task</span>
              <span><kbd>/</kbd> search</span>
              <span>Double-click a title to edit</span>
              <span>Drag rows to reorder</span>
            </p>
          </section>
        ) : (
          <section id="panel-profile" role="tabpanel" aria-labelledby="tab-profile" className="page">
            <ProfilePage user={user} onSave={saveProfile} todos={todos} />
          </section>
        )}
      </main>

      <div className="floating-stack">
        {toast && <Toast message={toast.message} onUndo={toast.onUndo} onClose={() => setToast(null)} />}
        {activeTab === 'todos' && selectedIds.length > 0 && (
          <BulkBar
            count={selectedIds.length}
            onStatus={bulkChangeStatus}
            onDelete={() => deleteTodos(selectedIds)}
            onClear={() => setSelectedIds([])}
          />
        )}
      </div>
    </div>
  )
}

export default App
