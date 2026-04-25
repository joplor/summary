import { useState, useRef, useEffect } from 'react'
import {
  Mic, Square, Pause, Play, Download, Settings,
  Search, X, Layers, History, Moon, Sun, HelpCircle, Menu
} from 'lucide-react'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatSavedAt(date) {
  if (!date) return null
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 10) return 'Just saved'
  if (diff < 60) return `Saved ${diff}s ago`
  const mins = Math.floor(diff / 60)
  return `Saved ${mins}m ago`
}

export default function Header({
  isRecording, isPaused, onStartStop, onPause, onResume,
  searchQuery, onSearch, onOpenSettings, onOpenSessions, onOpenExport,
  sessionName, onRenameSession, hasContent,
  savedAt, darkMode, onToggleDark, onOpenShortcuts,
  searchMatchCount, recordingTime, wordCount,
}) {
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(sessionName)
  const [showSearch, setShowSearch] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const searchInputRef = useRef(null)
  const mobileMenuRef = useRef(null)

  // Keep nameVal in sync with sessionName when not editing
  useEffect(() => {
    if (!editingName) setNameVal(sessionName)
  }, [sessionName, editingName])

  // Focus search when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Close mobile menu on outside click
  useEffect(() => {
    if (!showMobileMenu) return
    const handler = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setShowMobileMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMobileMenu])

  const commitName = () => {
    setEditingName(false)
    if (nameVal.trim()) onRenameSession(nameVal.trim())
    else setNameVal(sessionName)
  }

  const savedLabel = formatSavedAt(savedAt)

  return (
    <header className="h-16 flex items-center px-4 gap-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shrink-0 z-20">

      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center shadow-md shadow-brand-500/30">
          <Layers className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-sm brand-gradient hidden sm:block">LectureAI</span>
      </div>

      {/* Vertical divider */}
      <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 shrink-0 hidden sm:block" />

      {/* Session name + saved indicator */}
      <div className="flex flex-col min-w-0 flex-1 hidden md:flex">
        {editingName ? (
          <input
            autoFocus
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={commitName}
            onKeyDown={e => {
              if (e.key === 'Enter') commitName()
              if (e.key === 'Escape') { setEditingName(false); setNameVal(sessionName) }
            }}
            className="text-sm font-medium bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-0.5 outline-none w-52 text-slate-700 dark:text-slate-200 border border-brand-400"
          />
        ) : (
          <button
            onClick={() => { setEditingName(true); setNameVal(sessionName) }}
            className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate max-w-[200px] text-left leading-tight"
            title="Click to rename session"
          >
            {sessionName}
          </button>
        )}
        {savedLabel && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{savedLabel}</span>
        )}
        {wordCount > 0 && !savedLabel && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{wordCount.toLocaleString()} words</span>
        )}
      </div>

      {/* Center: Search bar (md+) */}
      <div className="hidden md:flex flex-1 max-w-xs justify-center">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5 w-full border border-slate-200 dark:border-slate-700 focus-within:border-brand-400 transition-colors">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search transcript…"
            className="bg-transparent text-xs text-slate-700 dark:text-slate-200 outline-none flex-1 min-w-0 placeholder:text-slate-400"
          />
          {searchQuery && (
            <>
              {searchMatchCount > 0 && (
                <span className="text-[10px] text-brand-500 font-medium shrink-0">{searchMatchCount}</span>
              )}
              <button onClick={() => onSearch('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right: Action icons */}
      <div className="flex items-center gap-1 shrink-0">

        {/* Mobile search toggle */}
        <button
          onClick={() => setShowSearch(s => !s)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* History */}
        <button
          onClick={onOpenSessions}
          className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          title="Session history"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Export */}
        <button
          onClick={onOpenExport}
          disabled={!hasContent}
          className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Export"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Shortcuts help */}
        <button
          onClick={onOpenShortcuts}
          className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          title="Keyboard shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Mobile menu */}
        <div className="relative sm:hidden" ref={mobileMenuRef}>
          <button
            onClick={() => setShowMobileMenu(s => !s)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <Menu className="w-4 h-4" />
          </button>
          {showMobileMenu && (
            <div className="absolute right-0 top-10 w-44 glass-card rounded-2xl py-1 z-50 animate-scale-in shadow-lg">
              <button onClick={() => { onOpenSessions(); setShowMobileMenu(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <History className="w-4 h-4 text-slate-400" /> History
              </button>
              <button onClick={() => { onOpenExport(); setShowMobileMenu(false) }} disabled={!hasContent} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30">
                <Download className="w-4 h-4 text-slate-400" /> Export
              </button>
              <button onClick={() => { onToggleDark(); setShowMobileMenu(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                {darkMode ? <Sun className="w-4 h-4 text-slate-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
                {darkMode ? 'Light mode' : 'Dark mode'}
              </button>
              <button onClick={() => { onOpenSettings(); setShowMobileMenu(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Settings className="w-4 h-4 text-slate-400" /> Settings
              </button>
              <button onClick={() => { onOpenShortcuts(); setShowMobileMenu(false) }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <HelpCircle className="w-4 h-4 text-slate-400" /> Shortcuts
              </button>
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

        {/* Pause/Resume (only when recording) */}
        {isRecording && (
          <button
            onClick={isPaused ? onResume : onPause}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        )}

        {/* Record / Stop button */}
        <button
          onClick={onStartStop}
          className={`relative flex items-center gap-2 px-4 h-9 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/30'
              : 'bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/30'
          }`}
        >
          {isRecording && !isPaused && (
            <span className="absolute -inset-1 rounded-[14px] border-2 border-red-400/50 animate-ping pointer-events-none" />
          )}
          {isRecording ? (
            <>
              <Square className="w-3.5 h-3.5 fill-white shrink-0" />
              <span className="font-mono">{formatTime(recordingTime)}</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 shrink-0" />
              <span>Record</span>
            </>
          )}
        </button>
      </div>

      {/* Mobile search bar (full-width below header) */}
      {showSearch && (
        <div className="md:hidden absolute top-16 left-0 right-0 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 z-20 animate-slide-down">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 focus-within:border-brand-400 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={e => onSearch(e.target.value)}
              placeholder="Search transcript…"
              className="bg-transparent text-sm text-slate-700 dark:text-slate-200 outline-none flex-1 min-w-0 placeholder:text-slate-400"
            />
            {searchQuery && searchMatchCount > 0 && (
              <span className="text-xs text-brand-500 font-medium shrink-0">{searchMatchCount} matches</span>
            )}
            <button onClick={() => { setShowSearch(false); onSearch('') }} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
