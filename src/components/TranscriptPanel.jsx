import { useEffect, useRef, useState } from 'react'
import { Pin, PinOff, Copy, Wand2, ChevronDown } from 'lucide-react'
import { highlightText, speakerDotColor } from '../utils/nlp.js'

const SPEAKER_PILL_CLASSES = [
  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-800',
]

function getSpeakerPillClass(index) {
  return SPEAKER_PILL_CLASSES[index % SPEAKER_PILL_CLASSES.length]
}

function TranscriptEntry({ entry, searchQuery, onPin, onExplain, isNew }) {
  const [hovered, setHovered] = useState(false)

  const highlighted = searchQuery
    ? highlightText(entry.text, searchQuery)
    : null

  const speakerIndex = entry.speakerIndex || 0
  const pillClass = getSpeakerPillClass(speakerIndex)

  return (
    <div
      className={`group relative px-5 py-3.5 border-l-2 transition-all duration-300 cursor-default
        ${isNew ? 'animate-slide-up' : ''}
        ${entry.pinned
          ? 'border-l-amber-400 bg-amber-50/60 dark:bg-amber-900/10'
          : 'border-l-transparent hover:border-l-brand-300 hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
        }
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Speaker + time */}
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${pillClass}`}>
          {entry.speaker}
        </span>
        <span className="text-[10px] text-slate-300 dark:text-slate-600 font-mono">
          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        {entry.pinned && (
          <span className="ml-auto text-[10px] font-semibold text-amber-500 uppercase tracking-wide">Pinned</span>
        )}
      </div>

      {/* Text */}
      <p
        className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed"
        dangerouslySetInnerHTML={highlighted ? { __html: highlighted } : undefined}
      >
        {!highlighted ? entry.text : undefined}
      </p>

      {/* Action buttons on hover */}
      <div className={`absolute right-3 top-3 flex items-center gap-1 transition-all duration-200 ${hovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
        <button
          onClick={() => onPin(entry.id)}
          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:border-amber-300 transition-all shadow-sm"
          title={entry.pinned ? 'Unpin' : 'Pin'}
        >
          {entry.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => navigator.clipboard?.writeText(entry.text)}
          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-brand-500 hover:border-brand-300 transition-all shadow-sm"
          title="Copy"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onExplain(entry.text)}
          className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-violet-500 hover:border-violet-300 transition-all shadow-sm"
          title="Explain simply"
        >
          <Wand2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function TranscriptPanel({ transcript, interimText, searchQuery, onPin, onExplain, isRecording, wordCount }) {
  const bottomRef = useRef(null)
  const containerRef = useRef(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const lastCountRef = useRef(0)

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [transcript.length, interimText, autoScroll])

  useEffect(() => {
    if (transcript.length !== lastCountRef.current) {
      lastCountRef.current = transcript.length
    }
  }, [transcript.length])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    setAutoScroll(atBottom)
    setShowScrollBtn(!atBottom)
  }

  const filteredTranscript = searchQuery
    ? transcript.filter(e => e.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : transcript

  return (
    <div className="flex flex-col h-full border-r border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/20">
      {/* Panel header */}
      <div className="panel-header shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 animate-pulse-dot recording-ring' : 'bg-slate-300 dark:bg-slate-600'}`} />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Live Transcript</span>
          {filteredTranscript.length > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {searchQuery ? `${filteredTranscript.length} matches` : `${transcript.length} segments`}
            </span>
          )}
          {wordCount > 0 && !searchQuery && (
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
              {wordCount.toLocaleString()} words
            </span>
          )}
        </div>
        {!autoScroll && (
          <button
            onClick={() => { setAutoScroll(true); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
            className="text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
          >
            Jump to live
          </button>
        )}
      </div>

      {/* Transcript list */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scroll"
      >
        {filteredTranscript.length === 0 && !interimText ? (
          <EmptyState isRecording={isRecording} hasSearchQuery={!!searchQuery} />
        ) : (
          <>
            {/* Waveform animation when recording */}
            {isRecording && filteredTranscript.length === 0 && !interimText && (
              <div className="flex items-end justify-center gap-0.5 h-5 my-3">
                {Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-400 dark:bg-red-500 rounded-full waveform-bar"
                    style={{ animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            )}

            {filteredTranscript.map((entry, i) => (
              <TranscriptEntry
                key={entry.id}
                entry={entry}
                searchQuery={searchQuery}
                onPin={onPin}
                onExplain={onExplain}
                isNew={i === transcript.length - 1 && i === lastCountRef.current - 1}
              />
            ))}

            {/* Interim text */}
            {interimText && (
              <div className="px-5 py-3.5 border-l-2 border-l-brand-300 bg-blue-50/40 dark:bg-blue-900/10">
                <div className="flex items-center gap-2 mb-2">
                  {/* Waveform while listening */}
                  <div className="flex items-end gap-0.5 h-5">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-red-400 dark:bg-red-500 rounded-full waveform-bar"
                        style={{ animationDelay: `${i * 80}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-brand-500 uppercase tracking-wide">Listening…</span>
                </div>
                <p className="interim-text text-sm leading-relaxed pl-1">{interimText}</p>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => { setAutoScroll(true); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
          className="absolute bottom-16 left-1/4 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-500 text-white text-xs font-medium shadow-lg shadow-brand-500/30 hover:bg-brand-600 transition-all animate-fade-in"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          New content
        </button>
      )}
    </div>
  )
}

function EmptyState({ isRecording, hasSearchQuery }) {
  if (hasSearchQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="text-2xl">🔍</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">No matches found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 animate-fade-in">
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-100 to-blue-100 dark:from-brand-900/30 dark:to-blue-900/30 flex items-center justify-center">
        <span className="text-3xl">{isRecording ? '🎧' : '🎤'}</span>
      </div>
      <div>
        {isRecording && (
          <div className="flex items-end justify-center gap-0.5 h-5 mb-3">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="w-1 bg-red-400 dark:bg-red-500 rounded-full waveform-bar"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        )}
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">
          {isRecording ? 'Listening for speech…' : 'Ready to record'}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
          {isRecording
            ? 'Speak clearly into your microphone. Your words will appear here in real time.'
            : 'Press Record to start transcribing your lecture or meeting.'}
        </p>
      </div>
    </div>
  )
}
