import { useState } from 'react'
import { X, Eye, EyeOff, ExternalLink, Moon, Sun, Mic, Brain, Globe } from 'lucide-react'

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none
          ${checked ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'}`}
        style={{ height: '22px', width: '40px' }}
      >
        <span
          className={`toggle-thumb absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm`}
          style={{
            width: '18px', height: '18px',
            transform: checked ? 'translateX(18px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {children}
      </div>
    </div>
  )
}

export default function SettingsModal({ settings, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...settings })
  const [showKey, setShowKey] = useState(false)

  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }))

  const handleSave = () => {
    onSave(draft)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-lg max-h-[90vh] glass-card rounded-3xl flex flex-col animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/60 shrink-0">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Settings</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scroll px-6 py-5 space-y-6">

          {/* Appearance */}
          <Section icon={Sun} title="Appearance">
            <Toggle
              checked={draft.darkMode}
              onChange={v => set('darkMode', v)}
              label="Dark mode"
              description="Switch between light and dark theme"
            />
          </Section>

          {/* Recording */}
          <Section icon={Mic} title="Recording">
            <div className="py-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-2">Language</label>
              <select
                value={draft.language}
                onChange={e => set('language', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-brand-400 transition-colors"
              >
                <option value="nb-NO">Norsk bokmål</option>
                <option value="nn-NO">Norsk nynorsk</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="sv-SE">Svenska</option>
                <option value="da-DK">Dansk</option>
                <option value="fi-FI">Suomi</option>
                <option value="de-DE">Deutsch</option>
                <option value="fr-FR">Français</option>
                <option value="es-ES">Español</option>
                <option value="it-IT">Italiano</option>
                <option value="pt-BR">Português (Brasil)</option>
                <option value="nl-NL">Nederlands</option>
                <option value="pl-PL">Polski</option>
                <option value="ru-RU">Русский</option>
                <option value="zh-CN">中文 (简体)</option>
                <option value="ja-JP">日本語</option>
                <option value="ko-KR">한국어</option>
                <option value="ar-SA">العربية</option>
                <option value="hi-IN">हिन्दी</option>
              </select>
            </div>
            <Toggle
              checked={draft.speakerDetection}
              onChange={v => set('speakerDetection', v)}
              label="Speaker detection"
              description="Heuristically detect speaker changes based on pauses"
            />
          </Section>

          {/* AI */}
          <Section icon={Brain} title="AI Features">
            <Toggle
              checked={draft.autoSummarize}
              onChange={v => set('autoSummarize', v)}
              label="Auto-summarize"
              description="Automatically generate a summary every 60 seconds"
            />

            <div className="py-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-2">AI Provider</label>
              <div className="flex gap-2">
                {['openai', 'anthropic'].map(p => (
                  <button
                    key={p}
                    onClick={() => set('aiProvider', p)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                      draft.aiProvider === p
                        ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {p === 'openai' ? 'OpenAI' : 'Anthropic'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                {draft.aiProvider === 'openai'
                  ? 'Uses gpt-4o-mini. Works directly from the browser.'
                  : 'Uses claude-haiku. Requires a CORS proxy (see README).'}
              </p>
            </div>

            <div className="py-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-2">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={draft.apiKey}
                  onChange={e => set('apiKey', e.target.value)}
                  placeholder={draft.aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 pr-10 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-brand-400 transition-colors font-mono placeholder:font-sans"
                />
                <button
                  onClick={() => setShowKey(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1.5 leading-relaxed">
                Your key is stored only in your browser (localStorage) and never sent to our servers.
              </p>
            </div>

            {draft.aiProvider === 'anthropic' && (
              <div className="py-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-2">
                  Proxy URL
                  <span className="ml-1 text-xs text-slate-400 font-normal">(required for Anthropic)</span>
                </label>
                <input
                  type="url"
                  value={draft.proxyUrl}
                  onChange={e => set('proxyUrl', e.target.value)}
                  placeholder="https://your-proxy.workers.dev"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-brand-400 transition-colors font-mono placeholder:font-sans"
                />
              </div>
            )}
          </Section>

          {/* Translation */}
          <Section icon={Globe} title="Translation">
            <Toggle
              checked={draft.translationEnabled}
              onChange={v => set('translationEnabled', v)}
              label="Enable translation"
              description="Show a translate button for each transcript segment (requires API key)"
            />
            {draft.translationEnabled && (
              <div className="py-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200 block mb-2">Target language</label>
                <select
                  value={draft.translateTo || 'English'}
                  onChange={e => set('translateTo', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-brand-400 transition-colors"
                >
                  {['English','Spanish','French','German','Italian','Portuguese','Chinese','Japanese','Korean','Arabic'].map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            )}
          </Section>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200/60 dark:border-slate-700/60 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold shadow-md shadow-brand-500/25 transition-all active:scale-95">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}
