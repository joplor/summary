import { X } from 'lucide-react'

function ShortcutRow({ keys, description }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-slate-600 dark:text-slate-300">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <span key={i} className="kbd text-slate-600 dark:text-slate-300">{k}</span>
        ))}
      </div>
    </div>
  )
}

function ShortcutGroup({ title, shortcuts }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{title}</h3>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {shortcuts.map((s, i) => (
          <ShortcutRow key={i} keys={s.keys} description={s.description} />
        ))}
      </div>
    </div>
  )
}

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-lg glass-card rounded-3xl flex flex-col animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Keyboard Shortcuts</h2>
            <p className="text-xs text-slate-400 mt-0.5">Press <span className="kbd">?</span> to open this dialog</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-2 gap-6 overflow-y-auto custom-scroll">
          <ShortcutGroup
            title="Recording"
            shortcuts={[
              { keys: ['Space'], description: 'Pause / Resume' },
              { keys: ['Ctrl', 'S'], description: 'Force save' },
            ]}
          />
          <ShortcutGroup
            title="Navigation"
            shortcuts={[
              { keys: ['Ctrl', 'F'], description: 'Search transcript' },
              { keys: ['Esc'], description: 'Close / Clear' },
              { keys: ['N'], description: 'New session' },
            ]}
          />
          <ShortcutGroup
            title="Content"
            shortcuts={[
              { keys: ['?'], description: 'This help' },
            ]}
          />
          <ShortcutGroup
            title="Export"
            shortcuts={[
              { keys: ['Ctrl', 'Shift', 'E'], description: 'Open export' },
            ]}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/60 dark:border-slate-700/60 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
