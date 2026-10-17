// Same limits the backend enforces
export const MAX_TITLE_LENGTH = 200
export const MAX_DISPLAY_NAME_LENGTH = 80
export const USERNAME_PATTERN = '[a-zA-Z0-9_.]{3,30}'

export const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

export const FILTERS = [
  { value: 'all', label: 'All' },
  ...STATUSES,
  { value: 'starred', label: 'Starred' },
]

export function getStatusLabel(value) {
  return STATUSES.find((status) => status.value === value)?.label ?? value
}

// To Do -> In Progress -> Done -> To Do
export function getNextStatus(value) {
  const index = STATUSES.findIndex((status) => status.value === value)
  return STATUSES[(index + 1) % STATUSES.length].value
}

export function getInitials(name) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}

export function getGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function timeAgo(timestamp, now = Date.now()) {
  const minutes = Math.floor((now - timestamp) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
