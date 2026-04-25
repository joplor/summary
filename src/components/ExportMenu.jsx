import { useState } from 'react'
import { X, FileText, File, Code } from 'lucide-react'

const FORMATS = [
  { id: 'pdf', label: 'PDF', icon: File, description: 'Formatted document with headers', color: 'text-red-500' },
  { id: 'markdown', label: 'Markdown', icon: Code, description: '.md for Notion, Obsidian, etc.', color: 'text-brand-500' },
  { id: 'txt', label: 'Plain Text', icon: FileText, description: 'Simple .txt file', color: 'text-slate-500' },
]

export default function ExportMenu({ onExport, onClose, session }) {
  const [format, setFormat] = useState('pdf')
  const [includeTranscript, setIncludeTranscript] = useState(true)
  const [includeSummary, setIncludeSummary] = useState(true)
  const [includeNotes, setIncludeNotes] = useState(true)
  const [includeFlashcards, setIncludeFlashcards] = useState(false)

  const handleExport = () => {
    onExport(format)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-sm glass-card rounded-3xl flex flex-col animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60 shrink-0">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Export Session</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Format selector */}
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Format</p>
            <div className="flex gap-2">
              {FORMATS.map(f => {
                const Icon = f.icon
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 text-center transition-all ${
                      format === f.id
                        ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${format === f.id ? 'text-brand-500' : f.color}`} />
                    <span className={`text-xs font-semibold ${format === f.id ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-300'}`}>
                      {f.label}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight hidden sm:block">{f.description}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Include checkboxes */}
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Include</p>
            <div className="space-y-2.5">
              {[
                { id: 'transcript', label: 'Transcript', state: includeTranscript, setState: setIncludeTranscript },
                { id: 'summary', label: 'Summary', state: includeSummary, setState: setIncludeSummary },
                { id: 'notes', label: 'Notes', state: includeNotes, setState: setIncludeNotes },
                { id: 'flashcards', label: 'Flashcards', state: includeFlashcards, setState: setIncludeFlashcards },
              ].map(item => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => item.setState(s => !s)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                      item.state
                        ? 'bg-brand-500 border-brand-500'
                        : 'border-slate-300 dark:border-slate-600 group-hover:border-brand-300'
                    }`}
                  >
                    {item.state && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-200">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200/60 dark:border-slate-700/60 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-md shadow-brand-500/25 transition-all active:scale-95"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  )
}
