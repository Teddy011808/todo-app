import { STATUSES } from '../constants'
import { ChevronDownIcon } from './Icons'

// A native <select> styled as a colored pill
function StatusSelect({ value, onChange, size = 'small', ...props }) {
  return (
    <span className={`status-select ${value} ${size}`}>
      <select value={value} onChange={(event) => onChange(event.target.value)} {...props}>
        {STATUSES.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon size={size === 'large' ? 16 : 13} />
    </span>
  )
}

export default StatusSelect
