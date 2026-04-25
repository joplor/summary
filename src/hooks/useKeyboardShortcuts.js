import { useEffect } from 'react'

export function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    const handle = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      const key = e.key
      const ctrl = e.ctrlKey || e.metaKey

      if (key === ' ' && !ctrl && !e.shiftKey) {
        e.preventDefault()
        handlers.togglePause?.()
      }
      if (key === '?') handlers.showShortcuts?.()
      if (key === 'Escape') handlers.escape?.()
      if (key === 'n' && !ctrl) handlers.newSession?.()
      if (ctrl && key === 'f') { e.preventDefault(); handlers.openSearch?.() }
      if (ctrl && key === 's') { e.preventDefault(); handlers.forceSave?.() }
      if (ctrl && e.shiftKey && key === 'E') { e.preventDefault(); handlers.openExport?.() }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [handlers])
}
