import { useState } from 'react'
import { ChevronDown, ChevronRight, Lightbulb, Target, BookMarked, CheckSquare, Clock } from 'lucide-react'

function Section({ icon: Icon, title, color, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-slate-200/70 dark:border-slate-700/50 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 bg-white/60 dark:bg-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-800/60 transition-colors"
      >
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1 text-left">{title}</span>
        {open
          ? <ChevronDown className="w-4 h-4 text-slate-400 transition-transform" />
          : <ChevronRight className="w-4 h-4 text-slate-400 transition-transform" />
        }
      </button>
      <div className={`transition-all duration-300 overflow-hidden ${open ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 pt-2 bg-white/30 dark:bg-slate-800/20">
          {children}
        </div>
      </div>
    </div>
  )
}

function BulletList({ items, color = 'text-brand-500' }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
          <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${color} bg-current`} />
          <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function SummaryCard({ summaries, isGenerating, hasTranscript }) {
  if (isGenerating) {
    return (
      <div className="p-5 space-y-4 overflow-y-auto custom-scroll h-full">
        <div className="flex items-center gap-2 text-brand-500 mb-2">
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-dot" />
          <span className="text-xs font-semibold">AI is analyzing your lecture…</span>
        </div>
        {[
          { w: '85%' }, { w: '70%' }, { w: '90%' }, { w: '60%' }, { w: '78%' }
        ].map((s, i) => (
          <div key={i} className="h-4 rounded-full shimmer" style={{ width: s.w }} />
        ))}
      </div>
    )
  }

  if (!summaries.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 dark:from-brand-900/20 dark:to-violet-900/20 flex items-center justify-center border border-brand-100 dark:border-brand-800">
          <span className="text-2xl">✨</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">No summary yet</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {!hasTranscript
              ? 'Start recording and the AI will summarize automatically, or click Generate above.'
              : 'Click Generate to create an AI summary of your transcript.'}
          </p>
        </div>
      </div>
    )
  }

  const last = summaries[summaries.length - 1]

  return (
    <div className="h-full overflow-y-auto custom-scroll p-5 space-y-3">
      {/* Summary timestamp */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
        <Clock className="w-3 h-3" />
        <span>Updated {new Date(last.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        {summaries.length > 1 && (
          <span className="ml-auto text-brand-400 font-medium">v{summaries.length}</span>
        )}
      </div>

      {/* Key Points */}
      {last.bulletPoints?.length > 0 && (
        <Section icon={Target} title="Key Points" color="bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400">
          <BulletList items={last.bulletPoints} color="text-brand-500" />
        </Section>
      )}

      {/* Key Concepts */}
      {last.keyConcepts?.length > 0 && (
        <Section icon={Lightbulb} title="Key Concepts" color="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
          <div className="flex flex-wrap gap-2">
            {last.keyConcepts.map((c, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-scale-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {c}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Definitions */}
      {last.definitions?.length > 0 && (
        <Section icon={BookMarked} title="Definitions" color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400" defaultOpen={false}>
          <div className="space-y-3">
            {last.definitions.map((d, i) => (
              <div key={i} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">{d.term}</span>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">{d.definition}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Action Items */}
      {last.actionItems?.length > 0 && (
        <Section icon={CheckSquare} title="Action Items" color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" defaultOpen={false}>
          <div className="space-y-2">
            {last.actionItems.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="mt-0.5 w-4 h-4 rounded border-2 border-emerald-300 dark:border-emerald-700 shrink-0" />
                <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{a}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Version history hint */}
      {summaries.length > 1 && (
        <p className="text-xs text-slate-400 text-center pt-2">
          {summaries.length} summaries generated this session
        </p>
      )}
    </div>
  )
}
