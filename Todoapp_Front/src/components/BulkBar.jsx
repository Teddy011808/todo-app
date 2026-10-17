import { STATUSES } from '../constants'
import { StatusIcon, TrashIcon, XIcon } from './Icons'

function BulkBar({ count, onStatus, onDelete, onClear }) {
  return (
    <div className="bulk-bar" role="toolbar" aria-label="Bulk actions">
      <span className="bulk-count">{count} selected</span>
      <span className="bulk-divider" />
      {STATUSES.map((status) => (
        <button
          key={status.value}
          className={`bulk-btn ${status.value}`}
          onClick={() => onStatus(status.value)}
          title={`Mark as ${status.label}`}
          aria-label={`Mark selected as ${status.label}`}
        >
          <StatusIcon status={status.value} size={16} />
          <span className="bulk-label">{status.label}</span>
        </button>
      ))}
      <span className="bulk-divider" />
      <button className="bulk-btn danger" onClick={onDelete}>
        <TrashIcon size={16} />
        Delete
      </button>
      <button className="bulk-close" onClick={onClear} aria-label="Clear selection" title="Clear selection">
        <XIcon size={16} />
      </button>
    </div>
  )
}

export default BulkBar
