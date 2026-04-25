import { useState, useMemo } from 'react'
import { X, Trash2, RotateCcw, Mic, Search } from 'lucide-react'
import { formatDuration } from '../utils/nlp.js'

function SessionItem({ session, onLoad, onDelete, isCurrent }) {
  const duration = session.endTime
    ? Math.floor((session.endTime - session.startTime) / 1000)
    : null
  const segmentCount = session.transcript?.length || 0

  return (
    <div className={`group flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer card-hover
      ${isCurrent
        ? 'border-brand-300 dark:border-brand-700 bg-brand-50/60 dark:bg-brand-900/20'
        : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/40 hover:border-slate-300'
      }`}
      onClick={() => onLoad(session)}
    >
      <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
        <Mic className="w-4 h-4 text-brand-600 dark:text-brand-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
          {session.name}
          {isCurrent && <span className="ml-2 text-[10px] text-brand-500 font-bold uppercase tracking-wide">Current</span>}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-slate-400">{new Date(session.startTime).toLocaleDateString()}</span>
          {duration && <span className="text-xs text-slate-400">{formatDuration(duration)}</span>}
          <span className="text-xs text-slate-400">{segmentCount} segments</span>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onLoad(session) }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all"
          title="Load session"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        {!isCurrent && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(session.id) }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

export default function SessionsModal({ sessions, currentSessionId, onLoad, onDelete, onNew, onClose }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  const filtered = useMemo(() => {
    let list = [...sessions]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(s => s.name.toLowerCase().includes(q))
    }
    if (sortBy === 'newest') {
      list.sort((a, b) => b.startTime - a.startTime)
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => a.startTime - b.startTime)
    } else if (sortBy === 'segments') {
      list.sort((a, b) => (b.transcript?.length || 0) - (a.transcript?.length || 0))
    }
    return list
  }, [sessions, searchQuery, sortBy])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full h-full rounded-none sm:max-w-md sm:max-h-[85vh] sm:rounded-3xl glass-card flex flex-col animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Session History</h2>
            <p className="text-xs text-slate-400 mt-0.5">{sessions.length} saved sessions</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search + sort */}
        <div className="px-4 pt-3 pb-2 shrink-0 space-y-2">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 focus-within:border-brand-400 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search sessions…"
              className="bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none flex-1 min-w-0 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 shrink-0">Sort:</span>
            {[
              { id: 'newest', label: 'Newest' },
              { id: 'oldest', label: 'Oldest' },
              { id: 'segments', label: 'Most segments' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  sortBy === opt.id
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3 text-center animate-fade-in">
              <span className="text-3xl">📂</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {searchQuery ? 'No sessions match your search' : 'No saved sessions yet'}
              </p>
            </div>
          ) : (
            filtered.map(s => (
              <SessionItem
                key={s.id}
                session={s}
                isCurrent={s.id === currentSessionId}
                onLoad={(s) => { onLoad(s); onClose() }}
                onDelete={onDelete}
              />
            ))
          )}
        </div>

        <div className="px-4 pb-4 pt-2 shrink-0">
          <button
            onClick={() => { onNew(); onClose() }}
            className="w-full py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-md shadow-brand-500/25 transition-all active:scale-95"
          >
            + New Session
          </button>
        </div>
      </div>
    </div>
  )
}
