import { CheckIcon, XIcon } from './Icons'

function Toast({ message, onUndo, onClose }) {
  return (
    <div className="toast" role="status" aria-live="polite">
      <CheckIcon size={16} className="toast-icon" />
      <span className="toast-message">{message}</span>
      {onUndo && (
        <button className="toast-undo" onClick={onUndo}>
          Undo
        </button>
      )}
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">
        <XIcon size={14} />
      </button>
    </div>
  )
}

export default Toast
