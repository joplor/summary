import { useState } from 'react'
import { Sparkles, StickyNote, CreditCard, HelpCircle, RefreshCw, Pin } from 'lucide-react'
import SummaryCard from './SummaryCard.jsx'
import NotesPanel from './NotesPanel.jsx'

const TABS = [
  { id: 'summary', label: 'Summary', icon: Sparkles },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'flashcards', label: 'Flashcards', icon: CreditCard },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle },
]

export default function RightPanel({
  summaries, notes, flashcards, quizQuestions,
  isAISummarizing, onGenerateSummary, onGenerateFlashcards, onGenerateQuiz,
  onPinNote, onAddNote, onDeleteNote, activeTab, onTabChange,
  transcript, settings, onExplain,
}) {
  const hasSummary = summaries.length > 0
  const hasFlashcards = flashcards.length > 0
  const hasQuiz = quizQuestions.length > 0
  const hasTranscript = transcript.length > 0

  return (
    <div className="flex flex-col h-full bg-slate-50/40 dark:bg-slate-900/10">
      {/* Tabs */}
      <div className="panel-header shrink-0">
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl p-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                  ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab-specific actions */}
        <div className="flex items-center gap-2">
          {activeTab === 'summary' && (
            <button
              onClick={onGenerateSummary}
              disabled={isAISummarizing || !hasTranscript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAISummarizing ? 'animate-spin' : ''}`} />
              {isAISummarizing ? 'Generating…' : hasSummary ? 'Update' : 'Generate'}
            </button>
          )}
          {activeTab === 'flashcards' && (
            <button
              onClick={onGenerateFlashcards}
              disabled={isAISummarizing || !hasTranscript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isAISummarizing ? 'Generating…' : hasFlashcards ? 'Regenerate' : 'Generate'}
            </button>
          )}
          {activeTab === 'quiz' && (
            <button
              onClick={onGenerateQuiz}
              disabled={isAISummarizing || !hasTranscript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-sm shadow-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isAISummarizing ? 'Generating…' : hasQuiz ? 'Regenerate' : 'Generate'}
            </button>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'summary' && (
          <SummaryCard summaries={summaries} isGenerating={isAISummarizing} hasTranscript={hasTranscript} />
        )}
        {activeTab === 'notes' && (
          <NotesPanel notes={notes} onPin={onPinNote} onAdd={onAddNote} onDelete={onDeleteNote} transcript={transcript} />
        )}
        {activeTab === 'flashcards' && (
          <FlashcardsTab flashcards={flashcards} isGenerating={isAISummarizing} hasTranscript={hasTranscript} />
        )}
        {activeTab === 'quiz' && (
          <QuizTab questions={quizQuestions} isGenerating={isAISummarizing} hasTranscript={hasTranscript} />
        )}
      </div>
    </div>
  )
}

/* ─── Flashcards Tab ─── */
function FlashcardsTab({ flashcards, isGenerating, hasTranscript }) {
  const [flipped, setFlipped] = useState({})
  const [current, setCurrent] = useState(0)

  if (isGenerating) return <GeneratingState label="Creating flashcards" />
  if (!flashcards.length) return <EmptyAIState icon="🃏" label="Flashcards" hasTranscript={hasTranscript} hint="Generate AI flashcards from your transcript" />

  const card = flashcards[current]

  return (
    <div className="h-full flex flex-col p-5 gap-4 overflow-y-auto custom-scroll">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{current + 1} of {flashcards.length}</span>
        <div className="flex gap-1">
          {flashcards.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setFlipped(f => ({...f, [i]: false})) }}
              className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'}`}
            />
          ))}
        </div>
        <button
          onClick={() => { setCurrent((current + 1) % flashcards.length); setFlipped(f => ({...f, [(current + 1) % flashcards.length]: false})) }}
          className="text-brand-500 hover:text-brand-600 font-medium transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Flashcard */}
      <div
        className="flex-1 min-h-[200px] cursor-pointer"
        onClick={() => setFlipped(f => ({ ...f, [current]: !f[current] }))}
        style={{ perspective: '1000px' }}
      >
        <div
          className={`relative w-full h-full min-h-[200px] transition-transform duration-500 rounded-2xl`}
          style={{ transformStyle: 'preserve-3d', transform: flipped[current] ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 p-6 flex flex-col justify-between shadow-lg shadow-brand-500/20"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-brand-200 text-xs font-semibold uppercase tracking-wide flex items-center justify-between">
              <span>{card.topic || 'Question'}</span>
              <span className="text-brand-300 text-[10px] normal-case tracking-normal">Tap to reveal</span>
            </div>
            <p className="text-white text-lg font-semibold leading-snug">{card.question}</p>
            <div className="flex justify-center">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse-dot" />
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between shadow-lg"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="text-emerald-500 text-xs font-semibold uppercase tracking-wide">Answer</div>
            <p className="text-slate-700 dark:text-slate-200 text-base leading-relaxed">{card.answer}</p>
            <p className="text-xs text-slate-400">Tap to flip back</p>
          </div>
        </div>
      </div>

      {/* All cards list */}
      <div className="space-y-2 mt-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">All Cards</p>
        {flashcards.map((fc, i) => (
          <div
            key={i}
            onClick={() => { setCurrent(i); setFlipped(f => ({...f, [i]: false})) }}
            className={`p-3 rounded-xl border cursor-pointer transition-all card-hover text-sm
              ${i === current
                ? 'border-brand-300 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-700'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300'}`}
          >
            <p className="font-medium text-slate-700 dark:text-slate-200 text-xs">{fc.question}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Quiz Tab ─── */
function QuizTab({ questions, isGenerating, hasTranscript }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  if (isGenerating) return <GeneratingState label="Building quiz" />
  if (!questions.length) return <EmptyAIState icon="❓" label="Quiz" hasTranscript={hasTranscript} hint="Generate a multiple-choice quiz from your transcript" />

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.correct).length
    : null

  const reset = () => { setAnswers({}); setSubmitted(false) }

  return (
    <div className="h-full overflow-y-auto custom-scroll p-5 space-y-4">
      {submitted && (
        <div className={`p-4 rounded-2xl text-center animate-slide-up ${
          score / questions.length >= 0.7
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
        }`}>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{score}/{questions.length}</p>
          <p className={`text-sm font-medium ${score / questions.length >= 0.7 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {score / questions.length >= 0.8 ? 'Excellent!' : score / questions.length >= 0.6 ? 'Good job!' : 'Keep reviewing!'}
          </p>
          <button onClick={reset} className="mt-2 text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors">
            Try again
          </button>
        </div>
      )}

      {questions.map((q, qi) => {
        const answered = answers[qi] !== undefined
        const correct = q.correct
        const chosen = answers[qi]
        return (
          <div key={qi} className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 animate-slide-up" style={{ animationDelay: `${qi * 60}ms` }}>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug">
              <span className="text-brand-500 mr-1.5">{qi + 1}.</span>{q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                let cls = 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                if (submitted) {
                  if (oi === correct) cls = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  else if (oi === chosen && chosen !== correct) cls = 'border-red-300 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                } else if (chosen === oi) {
                  cls = 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                }
                return (
                  <button
                    key={oi}
                    disabled={submitted}
                    onClick={() => !submitted && setAnswers(a => ({ ...a, [qi]: oi }))}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs font-medium transition-all ${cls} ${!submitted ? 'hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/10' : ''}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
            {submitted && q.explanation && (
              <p className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg p-2 leading-relaxed">
                💡 {q.explanation}
              </p>
            )}
          </div>
        )
      })}

      {!submitted && Object.keys(answers).length === questions.length && (
        <button
          onClick={() => setSubmitted(true)}
          className="w-full py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow-md shadow-brand-500/25 transition-all active:scale-98 animate-slide-up"
        >
          Submit Quiz
        </button>
      )}
    </div>
  )
}

function GeneratingState({ label }) {
  return (
    <div className="p-5 space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-2" style={{ opacity: 1 - i * 0.15 }}>
          <div className="h-3 rounded-full shimmer" style={{ width: `${70 + i * 8}%` }} />
          <div className="h-3 rounded-full shimmer" style={{ width: `${50 + i * 5}%` }} />
        </div>
      ))}
      <p className="text-xs text-brand-500 font-medium animate-pulse mt-4">{label}…</p>
    </div>
  )
}

function EmptyAIState({ icon, label, hasTranscript, hint }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 dark:from-brand-900/20 dark:to-violet-900/20 flex items-center justify-center border border-brand-100 dark:border-brand-800">
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">{label}</p>
        <p className="text-xs text-slate-400 leading-relaxed">
          {!hasTranscript ? 'Start recording to generate content.' : hint}
        </p>
      </div>
    </div>
  )
}
