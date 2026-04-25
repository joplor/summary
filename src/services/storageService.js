const SESSIONS_KEY = 'lectureai_sessions'
const SETTINGS_KEY = 'lectureai_settings'

export function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveSession(session) {
  const sessions = loadSessions()
  const idx = sessions.findIndex(s => s.id === session.id)
  if (idx >= 0) {
    sessions[idx] = session
  } else {
    sessions.unshift(session)
  }
  // Keep max 20 sessions
  const trimmed = sessions.slice(0, 20)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed))
}

export function deleteSession(id) {
  const sessions = loadSessions().filter(s => s.id !== id)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null')
  } catch {
    return null
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
