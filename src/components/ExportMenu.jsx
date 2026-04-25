import { useRef, useEffect } from 'react'
import { FileText, File, Code, X } from 'lucide-react'

const OPTIONS = [
  { id: 'pdf', label: 'Export as PDF', sub: 'Formatted with headers and sections', icon: File, color: 'text-red-500' },
  { id: 'markdown', label: 'Export as Markdown', sub: '.md file for Notion, Obsidian, etc.', icon: Code, color: 'text-brand-500' },
  { id: 'txt', label: 'Export as Plain Text', sub: 'Simple .txt file', icon: FileText, color: 'text-slate-500' },
]

export default function ExportMenu({ onExport, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm animate-fade-in" />
      <div
        ref={ref}
        className="relative glass-card rounded-2xl p-2 min-w-[280px] animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 py-2 mb-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Export Session</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {OPTIONS.map(opt => {
          const Icon = opt.icon
          return (
            <button
              key={opt.id}
              onClick={() => { onExport(opt.id); onClose() }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group text-left"
            >
              <div className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform flex items-center justify-center ${opt.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{opt.label}</p>
                <p className="text-xs text-slate-400">{opt.sub}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
