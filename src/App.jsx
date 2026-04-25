import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import Header from './components/Header.jsx'
import TranscriptPanel from './components/TranscriptPanel.jsx'
import RightPanel from './components/RightPanel.jsx'
import StatusBar from './components/StatusBar.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import SessionsModal from './components/SessionsModal.jsx'
import ExportMenu from './components/ExportMenu.jsx'
import ToastContainer from './components/Toast.jsx'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal.jsx'
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js'
import { generateSummary, generateFlashcards, generateQuiz, explainSimply } from './services/aiService.js'
import { exportPDF, exportMarkdown, exportTxt } from './services/exportService.js'
import { loadSessions, saveSession, deleteSession, loadSettings, saveSettings } from './services/storageService.js'
import { detectTopics, generateId } from './utils/nlp.js'

// Map bare language codes (e.g. "nb") to full BCP-47 locales Chrome accepts
function normalizeLanguage(lang) {
  if (!lang) return 'en-US'
  if (lang.includes('-') || lang.includes('_')) return lang.replace('_', '-')
  const map = {
    nb: 'nb-NO', nn: 'nn-NO', no: 'nb-NO',
    en: 'en-US', fr: 'fr-FR', de: 'de-DE',
    es: 'es-ES', it: 'it-IT', pt: 'pt-BR',
    nl: 'nl-NL', sv: 'sv-SE', da: 'da-DK',
    fi: 'fi-FI', pl: 'pl-PL', ru: 'ru-RU',
    zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR',
    ar: 'ar-SA', hi: 'hi-IN',
  }
  return map[lang.toLowerCase()] || lang
}

const BROWSER_LANGUAGE = normalizeLanguage(navigator.language)

const DEFAULT_SETTINGS = {
  darkMode: false,
  autoSummarize: true,
  summarizeInterval: 60,
  language: BROWSER_LANGUAGE,
  aiProvider: 'openai',
  apiKey: '',
  proxyUrl: '',
  speakerDetection: true,
  translationEnabled: false,
  translateTo: 'English',
}

function newSession(name) {
  return {
    id: generateId(),
    name: name || `Session ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
    transcript: [],
    summaries: [],
    notes: [],
    flashcards: [],
    quizQuestions: [],
    startTime: Date.now(),
    endTime: null,
  }
}

export default function App() {
  const [settings, setSettings] = useState(() => {
    const stored = loadSettings()
    const merged = { ...DEFAULT_SETTINGS, ...(stored || {}) }
    // Migration: if the stored language is the old hardcoded 'en-US' default
    // and the browser is not an English locale, use the browser's language instead.
    if (stored && stored.language === 'en-US' && !BROWSER_LANGUAGE.startsWith('en')) {
      merged.language = BROWSER_LANGUAGE
    }
    return merged
  })
  const [session, setSession] = useState(() => newSession())
  const [sessions, setSessions] = useState(() => loadSessions())
  const [interimText, setInterimText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isAISummarizing, setIsAISummarizing] = useState(false)
  const [currentTopics, setCurrentTopics] = useState([])
  const [activeTab, setActiveTab] = useState('summary')
  const [searchQuery, setSearchQuery] = useState('')
  const [toasts, setToasts] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [splitPct, setSplitPct] = useState(45)
  const [mobileTab, setMobileTab] = useState('transcript')

  const timerRef = useRef(null)
  const autoSummarizeRef = useRef(null)
  const lastSummarizeCountRef = useRef(0)
  const draggingRef = useRef(false)
  const searchInputRef = useRef(null)

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode)
  }, [settings.darkMode])

  // Persist settings
  useEffect(() => { saveSettings(settings) }, [settings])

  // Persist session on change + update savedAt
  useEffect(() => {
    if (session.transcript.length > 0 || session.summaries.length > 0) {
      saveSession(session)
      setSessions(loadSessions())
      setSavedAt(new Date())
    }
  }, [session])

  // Topic detection
  useEffect(() => {
    if (session.transcript.length > 2) {
      const text = session.transcript.slice(-20).map(e => e.text).join(' ')
      setCurrentTopics(detectTopics(text))
    }
  }, [session.transcript.length])

  // Recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isRecording, isPaused])

  // Auto-summarize
  useEffect(() => {
    if (!isRecording || !settings.autoSummarize || !settings.apiKey) return
    autoSummarizeRef.current = setInterval(async () => {
      if (session.transcript.length > lastSummarizeCountRef.current + 3) {
        await handleGenerateSummary(true)
        lastSummarizeCountRef.current = session.transcript.length
      }
    }, settings.summarizeInterval * 1000)
    return () => clearInterval(autoSummarizeRef.current)
  }, [isRecording, settings.autoSummarize, settings.apiKey, session.transcript.length])

  // Computed values
  const wordCount = useMemo(() =>
    session.transcript.reduce((n, e) => n + e.text.split(/\s+/).filter(Boolean).length, 0),
    [session.transcript]
  )

  const searchMatchCount = useMemo(() => {
    if (!searchQuery) return 0
    return session.transcript.filter(e =>
      e.text.toLowerCase().includes(searchQuery.toLowerCase())
    ).length
  }, [session.transcript, searchQuery])

  const hasContent = session.transcript.length > 0

  const toast = useCallback((type, title, message, duration) => {
    const id = generateId()
    setToasts(t => [...t, { id, type, title, message, duration }])
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const handleEntry = useCallback((entry) => {
    setSession(s => ({ ...s, transcript: [...s.transcript, entry] }))
  }, [])

  const handleInterim = useCallback((text) => setInterimText(text), [])

  const handleRecognitionStart = useCallback(() => {
    toast('success', '🎤 Listening', 'Speak clearly — words will appear as you talk.')
  }, [toast])

  const handlePermissionDenied = useCallback(() => {
    setIsRecording(false)
    setIsPaused(false)
  }, [])

  const { isSupported, isListening, error, micPermission, start, stop } = useSpeechRecognition({
    onEntry: handleEntry,
    onInterim: handleInterim,
    onStart: handleRecognitionStart,
    onPermissionDenied: handlePermissionDenied,
    settings,
  })

  // Show speech errors as toasts with helpful guidance
  useEffect(() => {
    if (!error) return
    if (error === 'not-allowed') {
      toast('error', 'Microphone blocked',
        'Click the 🔒 lock icon in the address bar → Site settings → Microphone → Allow, then refresh the page.',
        8000)
    } else if (error === 'not-supported') {
      toast('error', 'Browser not supported', 'Speech recognition requires Chrome or Edge.')
    } else {
      toast('error', 'Microphone error', error)
    }
  }, [error])

  const handleStartStop = useCallback(() => {
    if (isRecording) {
      stop()
      setIsRecording(false)
      setIsPaused(false)
      setInterimText('')
      setSession(s => ({ ...s, endTime: Date.now() }))
      toast('success', 'Recording stopped', `${session.transcript.length} segments captured.`)
    } else {
      if (!isSupported) {
        toast('error', 'Not supported', 'Speech recognition requires Chrome or Edge.')
        return
      }
      setRecordingTime(0)
      lastSummarizeCountRef.current = 0
      start(settings.language)
      setIsRecording(true)
      setIsPaused(false)
    }
  }, [isRecording, isSupported, stop, start, settings.language, session.transcript.length, toast])

  const handlePause = useCallback(() => {
    stop()
    setIsPaused(true)
  }, [stop])

  const handleResume = useCallback(() => {
    start(settings.language)
    setIsPaused(false)
  }, [start, settings.language])

  const handleGenerateSummary = useCallback(async (auto = false) => {
    if (!settings.apiKey) {
      toast('warning', 'API key required', 'Add your OpenAI or Anthropic key in Settings.')
      setShowSettings(true)
      return
    }
    if (isAISummarizing) return
    setIsAISummarizing(true)
    try {
      const result = await generateSummary(session.transcript, settings)
      const summary = { ...result, id: generateId(), timestamp: Date.now() }
      setSession(s => ({ ...s, summaries: [...s.summaries, summary] }))
      if (!auto) {
        toast('success', 'Summary ready', 'AI summary has been generated.')
        setActiveTab('summary')
      }
    } catch (e) {
      toast('error', 'Summary failed', e.message)
    } finally {
      setIsAISummarizing(false)
    }
  }, [settings, session.transcript, isAISummarizing, toast])

  const handleGenerateFlashcards = useCallback(async () => {
    if (!settings.apiKey) { toast('warning', 'API key required', 'Add your key in Settings.'); setShowSettings(true); return }
    if (isAISummarizing) return
    setIsAISummarizing(true)
    try {
      const cards = await generateFlashcards(session.transcript, settings)
      setSession(s => ({ ...s, flashcards: cards }))
      toast('success', 'Flashcards ready', `${cards.length} cards generated.`)
      setActiveTab('flashcards')
    } catch (e) {
      toast('error', 'Flashcards failed', e.message)
    } finally {
      setIsAISummarizing(false)
    }
  }, [settings, session.transcript, isAISummarizing, toast])

  const handleGenerateQuiz = useCallback(async () => {
    if (!settings.apiKey) { toast('warning', 'API key required', 'Add your key in Settings.'); setShowSettings(true); return }
    if (isAISummarizing) return
    setIsAISummarizing(true)
    try {
      const questions = await generateQuiz(session.transcript, settings)
      setSession(s => ({ ...s, quizQuestions: questions }))
      toast('success', 'Quiz ready', `${questions.length} questions generated.`)
      setActiveTab('quiz')
    } catch (e) {
      toast('error', 'Quiz failed', e.message)
    } finally {
      setIsAISummarizing(false)
    }
  }, [settings, session.transcript, isAISummarizing, toast])

  const handleExplain = useCallback(async (text) => {
    if (!settings.apiKey) { toast('warning', 'API key required', 'Add your key in Settings.'); setShowSettings(true); return }
    try {
      const explanation = await explainSimply(text, settings)
      setSession(s => ({
        ...s,
        notes: [...s.notes, { id: generateId(), text: explanation, timestamp: Date.now(), type: 'auto', topic: 'Explanation', pinned: false }]
      }))
      toast('success', 'Explanation added', 'Saved to Notes tab.')
      setActiveTab('notes')
    } catch (e) {
      toast('error', 'Explain failed', e.message)
    }
  }, [settings, toast])

  const handlePinTranscriptEntry = useCallback((id) => {
    setSession(s => {
      const entry = s.transcript.find(e => e.id === id)
      const toggled = !entry?.pinned
      const updatedTranscript = s.transcript.map(e => e.id === id ? { ...e, pinned: !e.pinned } : e)
      let notes = s.notes
      if (entry) {
        if (toggled) {
          notes = [...notes, { id: generateId(), text: entry.text, timestamp: entry.timestamp, type: 'pinned', pinned: true }]
        } else {
          notes = notes.filter(n => n.text !== entry.text)
        }
      }
      return { ...s, transcript: updatedTranscript, notes }
    })
  }, [])

  const handlePinNote = useCallback((id) => {
    setSession(s => ({ ...s, notes: s.notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n) }))
  }, [])

  const handleAddNote = useCallback((note) => {
    setSession(s => ({ ...s, notes: [...s.notes, note] }))
  }, [])

  const handleDeleteNote = useCallback((id) => {
    setSession(s => ({ ...s, notes: s.notes.filter(n => n.id !== id) }))
  }, [])

  const handleExport = useCallback((format) => {
    try {
      if (format === 'pdf') exportPDF(session)
      else if (format === 'markdown') exportMarkdown(session)
      else if (format === 'txt') exportTxt(session)
      toast('success', 'Exported!', `Your session was exported as ${format.toUpperCase()}.`)
    } catch (e) {
      toast('error', 'Export failed', e.message)
    }
  }, [session, toast])

  const handleSaveSettings = useCallback((newSettings) => {
    setSettings(newSettings)
    toast('success', 'Settings saved', 'Your preferences have been updated.')
  }, [toast])

  const handleLoadSession = useCallback((s) => {
    if (isRecording) { stop(); setIsRecording(false) }
    setSession(s)
    setCurrentTopics([])
    setSearchQuery('')
    setInterimText('')
    setActiveTab('summary')
    setRecordingTime(0)
  }, [isRecording, stop])

  const handleNewSession = useCallback(() => {
    if (isRecording) { stop(); setIsRecording(false) }
    setSession(newSession())
    setCurrentTopics([])
    setInterimText('')
    setRecordingTime(0)
    setActiveTab('summary')
    lastSummarizeCountRef.current = 0
    toast('info', 'New session', 'Started a fresh session.')
  }, [isRecording, stop, toast])

  const handleDeleteSession = useCallback((id) => {
    deleteSession(id)
    setSessions(loadSessions())
  }, [])

  const handleRenameSession = useCallback((name) => {
    setSession(s => ({ ...s, name }))
  }, [])

  // Keyboard shortcuts
  useKeyboardShortcuts({
    togglePause: () => {
      if (!isRecording) return
      if (isPaused) handleResume(); else handlePause()
    },
    showShortcuts: () => setShowShortcuts(true),
    newSession: () => { if (!isRecording) handleNewSession() },
    escape: () => {
      setShowSettings(false)
      setShowSessions(false)
      setShowExport(false)
      setShowShortcuts(false)
      setSearchQuery('')
    },
    forceSave: () => {
      if (session.transcript.length > 0) {
        saveSession(session)
        setSavedAt(new Date())
        toast('success', 'Saved', 'Session saved manually.')
      }
    },
    openExport: () => { if (hasContent) setShowExport(true) },
  })

  // Shared props objects to avoid repetition
  const transcriptProps = {
    transcript: session.transcript,
    interimText,
    searchQuery,
    onPin: handlePinTranscriptEntry,
    onExplain: handleExplain,
    isRecording: isRecording && !isPaused,
    wordCount,
  }

  const rightPanelProps = {
    summaries: session.summaries,
    notes: session.notes,
    flashcards: session.flashcards,
    quizQuestions: session.quizQuestions,
    isAISummarizing,
    onGenerateSummary: () => handleGenerateSummary(false),
    onGenerateFlashcards: handleGenerateFlashcards,
    onGenerateQuiz: handleGenerateQuiz,
    onPinNote: handlePinNote,
    onAddNote: handleAddNote,
    onDeleteNote: handleDeleteNote,
    activeTab,
    onTabChange: setActiveTab,
    transcript: session.transcript,
    settings,
    onExplain: handleExplain,
  }

  return (
    <div className="flex flex-col h-screen app-bg overflow-hidden">
      <Header
        isRecording={isRecording}
        isPaused={isPaused}
        onStartStop={handleStartStop}
        onPause={handlePause}
        onResume={handleResume}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onOpenSettings={() => setShowSettings(true)}
        onOpenSessions={() => setShowSessions(true)}
        onOpenExport={() => setShowExport(true)}
        sessionName={session.name}
        onRenameSession={handleRenameSession}
        hasContent={hasContent}
        savedAt={savedAt}
        darkMode={settings.darkMode}
        onToggleDark={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
        onOpenShortcuts={() => setShowShortcuts(true)}
        searchMatchCount={searchMatchCount}
        recordingTime={recordingTime}
        wordCount={wordCount}
      />

      <main
        className="flex flex-1 overflow-hidden"
        onMouseMove={e => {
          if (!draggingRef.current) return
          const pct = (e.clientX / window.innerWidth) * 100
          setSplitPct(Math.min(70, Math.max(30, pct)))
        }}
        onMouseUp={() => { draggingRef.current = false }}
        onMouseLeave={() => { draggingRef.current = false }}
      >
        {/* Mobile tab switcher */}
        <div className="md:hidden flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setMobileTab('transcript')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                mobileTab === 'transcript'
                  ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              🎤 Transcript
            </button>
            <button
              onClick={() => setMobileTab('ai')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                mobileTab === 'ai'
                  ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              ✨ AI
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {mobileTab === 'transcript'
              ? <TranscriptPanel {...transcriptProps} />
              : <RightPanel {...rightPanelProps} />
            }
          </div>
        </div>

        {/* Desktop: side-by-side with draggable divider */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          <div style={{ width: `${splitPct}%` }} className="min-w-0 relative overflow-hidden">
            <TranscriptPanel {...transcriptProps} />
          </div>
          <div
            className="w-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-brand-300 dark:hover:bg-brand-700 cursor-col-resize flex-shrink-0 transition-colors"
            onMouseDown={() => { draggingRef.current = true }}
          />
          <div className="flex-1 min-w-0 overflow-hidden">
            <RightPanel {...rightPanelProps} />
          </div>
        </div>
      </main>

      <StatusBar
        isRecording={isRecording}
        isPaused={isPaused}
        recordingTime={recordingTime}
        transcript={session.transcript}
        currentTopics={currentTopics}
        isAISummarizing={isAISummarizing}
        isSupported={isSupported}
      />

      {/* Modals */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          darkMode={settings.darkMode}
          onToggleDark={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
        />
      )}
      {showSessions && (
        <SessionsModal
          sessions={sessions}
          currentSessionId={session.id}
          onLoad={handleLoadSession}
          onDelete={handleDeleteSession}
          onNew={handleNewSession}
          onClose={() => setShowSessions(false)}
        />
      )}
      {showExport && (
        <ExportMenu
          onExport={handleExport}
          onClose={() => setShowExport(false)}
          session={session}
        />
      )}
      {showShortcuts && (
        <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
