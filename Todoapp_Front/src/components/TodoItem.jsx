import { useState } from 'react'
import { MAX_TITLE_LENGTH, getNextStatus, getStatusLabel, timeAgo } from '../constants'
import { GripIcon, PencilIcon, StarIcon, StatusIcon, TrashIcon } from './Icons'
import StatusSelect from './StatusSelect'

function TodoItem({
  todo,
  now,
  isSelected,
  isDragging,
  dropPosition,
  onToggleSelect,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(todo.title)

  function startEditing() {
    setDraftTitle(todo.title)
    setIsEditing(true)
  }

  function saveTitle() {
    if (draftTitle.trim()) onUpdate({ title: draftTitle.trim() })
    setIsEditing(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') saveTitle()
    if (event.key === 'Escape') setIsEditing(false)
  }

  const className = [
    'todo-item',
    `status-${todo.status}`,
    isSelected && 'selected',
    isDragging && 'dragging',
    dropPosition && `drop-${dropPosition}`,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li
      className={className}
      draggable={!isEditing}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragOver={(event) => {
        event.preventDefault()
        onDragOver()
      }}
      onDrop={(event) => {
        event.preventDefault()
        onDrop()
      }}
      onDragEnd={onDragEnd}
    >
      <span className="drag-handle" title="Drag to reorder">
        <GripIcon size={16} />
      </span>

      <input
        type="checkbox"
        className="checkbox row-checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        aria-label={`Select "${todo.title}"`}
      />

      <button
        className={`status-toggle ${todo.status}`}
        onClick={() => onUpdate({ status: getNextStatus(todo.status) })}
        title={`${getStatusLabel(todo.status)} · click to move to ${getStatusLabel(getNextStatus(todo.status))}`}
        aria-label={`Status ${getStatusLabel(todo.status)}, change to ${getStatusLabel(getNextStatus(todo.status))}`}
      >
        <StatusIcon status={todo.status} size={22} />
      </button>

      <div className="todo-body">
        {isEditing ? (
          <input
            className="input edit-input"
            value={draftTitle}
            maxLength={MAX_TITLE_LENGTH}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveTitle}
            aria-label="Edit task title"
            autoFocus
          />
        ) : (
          <span className="todo-title" onDoubleClick={startEditing} title="Double-click to edit">
            {todo.title}
          </span>
        )}
        <div className="todo-meta">
          <StatusSelect
            value={todo.status}
            onChange={(status) => onUpdate({ status })}
            aria-label="Change status"
          />
          <span className="todo-time">Added {timeAgo(todo.createdAt, now)}</span>
        </div>
      </div>

      <div className="todo-actions">
        <button
          className={`icon-btn star ${todo.starred ? 'on' : ''}`}
          onClick={() => onUpdate({ starred: !todo.starred })}
          title={todo.starred ? 'Remove priority' : 'Mark as priority'}
          aria-pressed={todo.starred}
        >
          <StarIcon size={18} filled={todo.starred} />
        </button>
        <button className="icon-btn" onClick={startEditing} title="Edit title" disabled={isEditing}>
          <PencilIcon size={17} />
        </button>
        <button className="icon-btn danger" onClick={onDelete} title="Delete">
          <TrashIcon size={17} />
        </button>
      </div>
    </li>
  )
}

export default TodoItem
