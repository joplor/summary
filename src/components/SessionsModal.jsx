import { useState } from 'react'
import { X, Clock, Trash2, Download, RotateCcw, Mic } from 'lucide-react'
import { formatDuration } from '../utils/nlp.js'

function SessionItem({ session, onLoad, onDelete, isCurrent }) {
  const duration = session.endTime
    ? Math.floor((session.endTime - session.startTime) / 1000)
    : null
  const wordCount = session.transcript?.reduce((s, e) => s + e.text.split(/\s+/).length, 0) || 0

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
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">{new Date(session.startTime).toLocaleDateString()}</span>
          {duration && <span className="text-xs text-slate-400">{formatDuration(duration)}</span>}
          {wordCount > 0 && <span className="text-xs text-slate-400">{wordCount.toLocaleString()} words</span>}
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-md max-h-[80vh] glass-card rounded-3xl flex flex-col animate-scale-in overflow-hidden"
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

        <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-2">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3 text-center animate-fade-in">
              <span className="text-3xl">📂</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">No saved sessions yet</p>
            </div>
          ) : (
            sessions.map(s => (
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
