import { useRef } from 'react'
import { FILTERS } from '../constants'
import { useShortcut } from '../useShortcut'
import { SearchIcon, StarIcon, XIcon } from './Icons'

function TodoToolbar({
  todos,
  visibleCount,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  allVisibleSelected,
  onToggleSelectAll,
}) {
  const searchRef = useRef(null)

  // Press "/" anywhere to jump to search
  useShortcut('/', () => searchRef.current?.focus())

  function countFor(value) {
    if (value === 'all') return todos.length
    if (value === 'starred') return todos.filter((todo) => todo.starred).length
    return todos.filter((todo) => todo.status === value).length
  }

  return (
    <>
      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`segment ${filter === f.value ? 'active' : ''}`}
              aria-pressed={filter === f.value}
              onClick={() => onFilterChange(f.value)}
            >
              {f.value === 'starred' && <StarIcon size={13} />}
              {f.label}
              <span className="count">{countFor(f.value)}</span>
            </button>
          ))}
        </div>

        <div className="search-box">
          <SearchIcon size={16} />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                onSearchChange('')
                event.target.blur()
              }
            }}
            placeholder="Search tasks"
            aria-label="Search tasks by title"
          />
          {search ? (
            <button className="search-clear" onClick={() => onSearchChange('')} aria-label="Clear search">
              <XIcon size={14} />
            </button>
          ) : (
            <kbd>/</kbd>
          )}
        </div>
      </div>

      <div className="list-header">
        <label className="checkbox-label">
          <input
            type="checkbox"
            className="checkbox"
            checked={allVisibleSelected}
            onChange={onToggleSelectAll}
            disabled={visibleCount === 0}
          />
          Select all
        </label>
        <span>
          {visibleCount} task{visibleCount === 1 ? '' : 's'}
        </span>
      </div>
    </>
  )
}

export default TodoToolbar
