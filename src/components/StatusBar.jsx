import { Wifi, WifiOff, Clock, BookOpen, Hash, Mic } from 'lucide-react'
import { formatDuration } from '../utils/nlp.js'

export default function StatusBar({ isRecording, isPaused, recordingTime, transcript, currentTopics, isAISummarizing, isSupported }) {
  const wordCount = transcript.reduce((sum, e) => sum + e.text.split(/\s+/).length, 0)
  const segmentCount = transcript.length

  return (
    <div className="h-9 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex items-center px-5 gap-5 text-xs text-slate-400 dark:text-slate-500 shrink-0">

      {/* Recording indicator */}
      <div className="flex items-center gap-1.5">
        {isRecording && !isPaused ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-dot" />
            <span className="text-red-500 font-medium">Recording</span>
          </>
        ) : isPaused ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-amber-500 font-medium">Paused</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>Idle</span>
          </>
        )}
      </div>

      {/* Timer */}
      {(isRecording || recordingTime > 0) && (
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span className="font-mono font-medium text-slate-600 dark:text-slate-300">{formatDuration(recordingTime)}</span>
        </div>
      )}

      {/* Word count */}
      {wordCount > 0 && (
        <div className="flex items-center gap-1">
          <Hash className="w-3 h-3" />
          <span>{wordCount.toLocaleString()} words</span>
        </div>
      )}

      {/* Segment count */}
      {segmentCount > 0 && (
        <div className="flex items-center gap-1">
          <Mic className="w-3 h-3" />
          <span>{segmentCount} segments</span>
        </div>
      )}

      {/* Topics */}
      {currentTopics.length > 0 && (
        <div className="flex items-center gap-1.5">
          <BookOpen className="w-3 h-3" />
          <div className="flex gap-1">
            {currentTopics.slice(0, 2).map(t => (
              <span key={t} className="px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-medium text-[10px]">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI summarizing indicator */}
      {isAISummarizing && (
        <div className="flex items-center gap-1 text-brand-500 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          <span className="font-medium">AI summarizing…</span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-1">
        {isSupported ? (
          <Wifi className="w-3 h-3 text-emerald-500" />
        ) : (
          <WifiOff className="w-3 h-3 text-red-400" />
        )}
        <span className="text-[10px]">{isSupported ? 'Speech ready' : 'Not supported'}</span>
      </div>
    </div>
  )
}
