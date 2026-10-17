import { useEffect, useState } from 'react'
import { CheckIcon, SearchIcon } from './Icons'
import TodoItem from './TodoItem'

function TodoList({
  todos,
  hasAnyTodos,
  selectedIds,
  onToggleSelect,
  onUpdate,
  onDelete,
  onMove,
  onClearFilters,
}) {
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  // Refresh the "5m ago" labels every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(timer)
  }, [])

  if (todos.length === 0) {
    return (
      <div className="empty">
        <div className="empty-icon">{hasAnyTodos ? <SearchIcon size={26} /> : <CheckIcon size={26} />}</div>
        <h3>{hasAnyTodos ? 'No matching tasks' : 'No tasks yet'}</h3>
        <p>{hasAnyTodos ? 'Try another filter or search term.' : 'Add your first task above to get started.'}</p>
        {hasAnyTodos && (
          <button className="btn small" onClick={onClearFilters}>
            Clear filters
          </button>
        )}
      </div>
    )
  }

  const dragIndex = todos.findIndex((todo) => todo.id === dragId)

  function resetDrag() {
    setDragId(null)
    setOverId(null)
  }

  return (
    <ul className={`todo-list ${selectedIds.length > 0 ? 'selecting' : ''}`}>
      {todos.map((todo, index) => {
        // Show the drop line below when dragging down, above when dragging up
        let dropPosition = null
        if (dragId && overId === todo.id && dragId !== todo.id) {
          dropPosition = index > dragIndex ? 'after' : 'before'
        }

        return (
          <TodoItem
            key={todo.id}
            todo={todo}
            now={now}
            isSelected={selectedIds.includes(todo.id)}
            isDragging={dragId === todo.id}
            dropPosition={dropPosition}
            onToggleSelect={() => onToggleSelect(todo.id)}
            onUpdate={(changes) => onUpdate(todo.id, changes)}
            onDelete={() => onDelete(todo.id)}
            onDragStart={() => setDragId(todo.id)}
            onDragOver={() => setOverId(todo.id)}
            onDrop={() => {
              onMove(dragId, todo.id)
              resetDrag()
            }}
            onDragEnd={resetDrag}
          />
        )
      })}
    </ul>
  )
}

export default TodoList
