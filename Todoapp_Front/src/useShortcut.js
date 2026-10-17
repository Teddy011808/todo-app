import { useEffect } from 'react'

// Runs `callback` when `key` is pressed, unless the user is typing in a field.
export function useShortcut(key, callback) {
  useEffect(() => {
    function handleKeyDown(event) {
      const tag = event.target.tagName
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (event.key.toLowerCase() !== key) return
      event.preventDefault()
      callback()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback])
}
