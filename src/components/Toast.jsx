import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const ICONS = {
  success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
  warning: <AlertCircle className="w-4 h-4 text-amber-500" />,
  info: <Info className="w-4 h-4 text-brand-500" />,
}

function Toast({ toast, onDismiss }) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setLeaving(true)
      setTimeout(() => onDismiss(toast.id), 280)
    }, toast.duration || 3500)
    return () => clearTimeout(t)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-2xl glass-card min-w-[260px] max-w-[360px] cursor-pointer
        ${leaving ? 'animate-toast-out' : 'animate-toast-in'}`}
      onClick={() => { setLeaving(true); setTimeout(() => onDismiss(toast.id), 280) }}
    >
      <div className="mt-0.5 shrink-0">{ICONS[toast.type] || ICONS.info}</div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{toast.title}</p>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{toast.message}</p>
      </div>
      <button className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mt-0.5">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}
