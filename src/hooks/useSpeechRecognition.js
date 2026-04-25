import { useRef, useState, useCallback, useEffect } from 'react'
import { generateId, speakerColor } from '../utils/nlp.js'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export function useSpeechRecognition({ onEntry, onInterim, onStart, onPermissionDenied, settings }) {
  const recognitionRef = useRef(null)
  const restartTimerRef = useRef(null)
  const [isSupported] = useState(() => !!SpeechRecognition)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)
  const [micPermission, setMicPermission] = useState('unknown')

  const lastSpeechRef = useRef(Date.now())
  const speakerIndexRef = useRef(0)
  const pauseThreshold = 5000

  // Track mic permission state via Permissions API
  useEffect(() => {
    if (!navigator.permissions) return
    navigator.permissions.query({ name: 'microphone' }).then(result => {
      setMicPermission(result.state)
      result.onchange = () => setMicPermission(result.state)
    }).catch(() => {})
  }, [])

  const getSpeaker = useCallback(() => {
    const now = Date.now()
    const gap = now - lastSpeechRef.current
    if (gap > pauseThreshold && lastSpeechRef.current !== 0) {
      speakerIndexRef.current = (speakerIndexRef.current + 1) % 4
    }
    lastSpeechRef.current = now
    const idx = speakerIndexRef.current
    return { name: `Speaker ${idx + 1}`, colorClass: speakerColor(idx), index: idx }
  }, [])

  const startRecognition = useCallback((language) => {
    if (recognitionRef.current) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
      setMicPermission('granted')
      onStart?.()
    }

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        if (result.isFinal) {
          const trimmed = text.trim()
          if (trimmed.length >= 1) {
            const speaker = getSpeaker()
            onEntry({
              id: generateId(),
              text: trimmed,
              timestamp: Date.now(),
              speaker: speaker.name,
              speakerIndex: speaker.index,
              colorClass: speaker.colorClass,
              pinned: false,
            })
          }
          onInterim('')
        } else {
          interim += text
        }
      }
      if (interim) onInterim(interim)
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return   // normal — just silence
      if (event.error === 'aborted') return      // normal — we stopped it
      if (event.error === 'network') return      // transient — onend will restart
      if (event.error === 'not-allowed') {
        setMicPermission('denied')
        setError('not-allowed')
        recognitionRef.current = null
        setIsListening(false)
        onPermissionDenied?.()
        return
      }
      setError(`Speech error: ${event.error}`)
    }

    recognition.onend = () => {
      // If we're still supposed to be recording, restart after a short delay.
      // Immediate restart causes "InvalidStateError" in some Chrome versions.
      if (recognitionRef.current) {
        clearTimeout(restartTimerRef.current)
        restartTimerRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            try { recognition.start() } catch { /* ignore transient errors */ }
          }
        }, 200)
      } else {
        setIsListening(false)
        onInterim('')
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (e) {
      setError('Could not start recording: ' + e.message)
      recognitionRef.current = null
    }
  }, [getSpeaker, onEntry, onInterim, onStart, onPermissionDenied])

  // No getUserMedia pre-step — it was causing a race condition where
  // getUserMedia held the hardware mic while SpeechRecognition tried to
  // claim it, leading to silent failures. SpeechRecognition handles its
  // own permission prompt natively in Chrome/Edge on HTTPS.
  const start = useCallback((language = 'en-US') => {
    if (!isSupported) {
      setError('not-supported')
      return false
    }
    if (recognitionRef.current) return true
    startRecognition(language)
    return true
  }, [isSupported, startRecognition])

  const stop = useCallback(() => {
    clearTimeout(restartTimerRef.current)
    if (recognitionRef.current) {
      const r = recognitionRef.current
      recognitionRef.current = null
      r.stop()
    }
    setIsListening(false)
    onInterim('')
    speakerIndexRef.current = 0
    lastSpeechRef.current = 0
  }, [onInterim])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(restartTimerRef.current)
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [])

  return { isSupported, isListening, error, micPermission, start, stop }
}
