import { useState } from 'react'
import { Pin, PinOff, Trash2, Plus, StickyNote } from 'lucide-react'
import { generateId, extractKeySentences } from '../utils/nlp.js'

function NoteCard({ note, onPin, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className={`group relative p-4 rounded-2xl border transition-all duration-200 card-hover animate-slide-up
      ${note.pinned
        ? 'border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-900/15'
        : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/40'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {note.pinned && (
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wide">Pinned</span>
          )}
          {note.topic && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-medium">
              {note.topic}
            </span>
          )}
          {note.type === 'auto' && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500">auto-extracted</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onPin(note.id)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-500 transition-colors"
            title={note.pinned ? 'Unpin' : 'Pin'}
          >
            {note.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
          {confirmDelete ? (
            <button
              onClick={() => onDelete(note.id)}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-red-500 hover:text-red-600 transition-colors text-[10px] font-bold"
              onBlur={() => setConfirmDelete(false)}
            >
              ✕
            </button>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{note.text}</p>

      <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-2">
        {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  )
}

export default function NotesPanel({ notes, onPin, onAdd, onDelete, transcript }) {
  const [newNote, setNewNote] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const handleAdd = () => {
    if (!newNote.trim()) return
    onAdd({ id: generateId(), text: newNote.trim(), timestamp: Date.now(), pinned: false, type: 'manual' })
    setNewNote('')
    setShowAdd(false)
  }

  const pinned = notes.filter(n => n.pinned)
  const unpinned = notes.filter(n => !n.pinned)

  const handleExtract = () => {
    const text = transcript.map(e => e.text).join(' ')
    const sentences = extractKeySentences(text, 5)
    sentences.forEach(s => {
      if (!notes.find(n => n.text === s)) {
        onAdd({ id: generateId(), text: s, timestamp: Date.now(), pinned: false, type: 'auto', topic: 'Auto-extracted' })
      }
    })
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Add note bar */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
        {showAdd ? (
          <div className="space-y-2 animate-slide-down">
            <textarea
              autoFocus
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAdd(); if (e.key === 'Escape') setShowAdd(false) }}
              placeholder="Write a note… (⌘Enter to save)"
              rows={3}
              className="w-full resize-none text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 outline-none focus:border-brand-400 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 transition-colors"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={!newNote.trim()}
                className="flex-1 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold disabled:opacity-40 transition-all active:scale-95"
              >
                Save Note
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-xs font-medium hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-all border border-brand-200 dark:border-brand-800"
            >
              <Plus className="w-3.5 h-3.5" />
              Add note
            </button>
            {transcript.length > 3 && (
              <button
                onClick={handleExtract}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 text-xs font-medium hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all border border-violet-200 dark:border-violet-800"
              >
                <StickyNote className="w-3.5 h-3.5" />
                Extract key sentences
              </button>
            )}
          </div>
        )}
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-3">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <span className="text-2xl">📌</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">No notes yet</p>
            <p className="text-xs text-slate-400">Add notes manually, pin transcript entries, or extract key sentences.</p>
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">Pinned</p>
                {pinned.map(n => <NoteCard key={n.id} note={n} onPin={onPin} onDelete={onDelete} />)}
              </div>
            )}
            {unpinned.length > 0 && (
              <div className="space-y-2">
                {pinned.length > 0 && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide px-1">Notes</p>}
                {unpinned.map(n => <NoteCard key={n.id} note={n} onPin={onPin} onDelete={onDelete} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
