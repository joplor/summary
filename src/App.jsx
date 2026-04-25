import { useState, useCallback, useEffect, useRef } from 'react'
import Header from './components/Header.jsx'
import TranscriptPanel from './components/TranscriptPanel.jsx'
import RightPanel from './components/RightPanel.jsx'
import StatusBar from './components/StatusBar.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import SessionsModal from './components/SessionsModal.jsx'
import ExportMenu from './components/ExportMenu.jsx'
import ToastContainer from './components/Toast.jsx'
import { useSpeechRecognition } from './hooks/useSpeechRecognition.js'
import { generateSummary, generateFlashcards, generateQuiz, explainSimply } from './services/aiService.js'
import { exportPDF, exportMarkdown, exportTxt } from './services/exportService.js'
import { loadSessions, saveSession, deleteSession, loadSettings, saveSettings } from './services/storageService.js'
import { detectTopics, generateId } from './utils/nlp.js'

const DEFAULT_SETTINGS = {
  darkMode: false,
  autoSummarize: true,
  summarizeInterval: 60,
  language: navigator.language || 'en-US',
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
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...loadSettings() }))
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

  const timerRef = useRef(null)
  const autoSummarizeRef = useRef(null)
  const lastSummarizeCountRef = useRef(0)

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode)
  }, [settings.darkMode])

  // Persist settings
  useEffect(() => { saveSettings(settings) }, [settings])

  // Persist session on change
  useEffect(() => {
    if (session.transcript.length > 0 || session.summaries.length > 0) {
      saveSession(session)
      setSessions(loadSessions())
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

  const { isSupported, isListening, error, micPermission, start, stop } = useSpeechRecognition({
    onEntry: handleEntry,
    onInterim: handleInterim,
    onStart: handleRecognitionStart,
    settings,
  })

  // Show speech errors as toasts with helpful guidance
  useEffect(() => {
    if (!error) return
    if (error === 'not-allowed') {
      toast('error', 'Microphone blocked',
        'Chrome blocked the mic. Click the 🔒 lock icon in the address bar → Site settings → Microphone → Allow, then refresh.',
        8000)
    } else {
      toast('error', 'Microphone error', error)
    }
  }, [error])

  const handleStartStop = useCallback(async () => {
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
      // start() requests mic permission first via getUserMedia, then
      // starts SpeechRecognition. It sets error='not-allowed' if blocked.
      const ok = await start(settings.language)
      if (ok === false) return  // mic was denied, error toast already shown
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

  return (
    <div className={`flex flex-col h-screen app-bg overflow-hidden`}>
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
        hasContent={session.transcript.length > 0}
      />

      <main className="flex flex-1 overflow-hidden">
        {/* Left: Transcript */}
        <div className="w-[45%] min-w-[280px] relative overflow-hidden">
          <TranscriptPanel
            transcript={session.transcript}
            interimText={interimText}
            searchQuery={searchQuery}
            onPin={handlePinTranscriptEntry}
            onExplain={handleExplain}
            isRecording={isRecording && !isPaused}
          />
        </div>

        {/* Right: AI Panel */}
        <div className="flex-1 overflow-hidden">
          <RightPanel
            summaries={session.summaries}
            notes={session.notes}
            flashcards={session.flashcards}
            quizQuestions={session.quizQuestions}
            isAISummarizing={isAISummarizing}
            onGenerateSummary={() => handleGenerateSummary(false)}
            onGenerateFlashcards={handleGenerateFlashcards}
            onGenerateQuiz={handleGenerateQuiz}
            onPinNote={handlePinNote}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            transcript={session.transcript}
            settings={settings}
            onExplain={handleExplain}
          />
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
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
