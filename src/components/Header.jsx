import { useState } from 'react'
import {
  Mic, MicOff, Square, Pause, Play, Download, Settings,
  Search, X, Layers, ChevronDown, History
} from 'lucide-react'

export default function Header({
  isRecording, isPaused, onStartStop, onPause, onResume,
  searchQuery, onSearch, onOpenSettings, onOpenSessions, onOpenExport,
  sessionName, onRenameSession, hasContent,
}) {
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(sessionName)
  const [showSearch, setShowSearch] = useState(false)

  const commitName = () => {
    setEditingName(false)
    if (nameVal.trim()) onRenameSession(nameVal.trim())
    else setNameVal(sessionName)
  }

  return (
    <header className="h-14 flex items-center px-5 gap-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shrink-0 z-20">

      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-1">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-md shadow-brand-500/30">
          <Layers className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-sm brand-gradient hidden sm:block">LectureAI</span>
      </div>

      {/* Session name */}
      <div className="flex-1 min-w-0 flex items-center">
        {editingName ? (
          <input
            autoFocus
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setEditingName(false); setNameVal(sessionName) } }}
            className="text-sm font-medium bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 outline-none w-52 text-slate-700 dark:text-slate-200 border border-brand-400"
          />
        ) : (
          <button
            onClick={() => { setEditingName(true); setNameVal(sessionName) }}
            className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate max-w-[200px] text-left"
            title="Click to rename session"
          >
            {sessionName}
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className={`flex items-center gap-2 transition-all duration-300 ${showSearch ? 'w-52' : 'w-8'} overflow-hidden`}>
        {showSearch ? (
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5 w-full border border-slate-200 dark:border-slate-700 focus-within:border-brand-400 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => onSearch(e.target.value)}
              placeholder="Search transcript…"
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 outline-none flex-1 min-w-0 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button onClick={() => onSearch('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="Search (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
      </div>

      {showSearch && (
        <button
          onClick={() => { setShowSearch(false); onSearch('') }}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex items-center gap-1.5">
        {/* Sessions */}
        <button
          onClick={onOpenSessions}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          title="Session history"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Export */}
        <button
          onClick={onOpenExport}
          disabled={!hasContent}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Export"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Pause/Resume (only when recording) */}
        {isRecording && (
          <button
            onClick={isPaused ? onResume : onPause}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        )}

        {/* Record / Stop */}
        <button
          onClick={onStartStop}
          className={`flex items-center gap-2 px-4 h-8 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/30'
              : 'bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/30'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span>Record</span>
            </>
          )}
        </button>
      </div>
    </header>
  )
}
