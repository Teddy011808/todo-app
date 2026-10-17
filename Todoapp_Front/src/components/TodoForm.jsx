import { useRef, useState } from 'react'
import { MAX_TITLE_LENGTH } from '../constants'
import { useShortcut } from '../useShortcut'
import { PlusIcon } from './Icons'
import StatusSelect from './StatusSelect'

function TodoForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('todo')
  const inputRef = useRef(null)

  // Press "N" anywhere to start typing a new task
  useShortcut('n', () => inputRef.current?.focus())

  function handleSubmit(event) {
    event.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim(), status)
    setTitle('')
    setStatus('todo')
    inputRef.current?.focus()
  }

  return (
    <form className="card todo-form" onSubmit={handleSubmit}>
      <PlusIcon className="add-icon" size={20} />
      <input
        ref={inputRef}
        className="title-input"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={MAX_TITLE_LENGTH}
        placeholder="Add a new task…"
        aria-label="Task title"
      />
      <StatusSelect value={status} onChange={setStatus} size="large" aria-label="Status" />
      <button type="submit" className="btn primary" disabled={!title.trim()}>
        Add task
      </button>
    </form>
  )
}

export default TodoForm
