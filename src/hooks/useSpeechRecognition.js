import { useRef, useState, useCallback, useEffect } from 'react'
import { generateId, speakerColor } from '../utils/nlp.js'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export function useSpeechRecognition({ onEntry, onInterim, onStart, settings }) {
  const recognitionRef = useRef(null)
  const [isSupported] = useState(() => !!SpeechRecognition)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)
  const [micPermission, setMicPermission] = useState('unknown') // 'unknown' | 'granted' | 'denied' | 'prompt'

  const lastSpeechRef = useRef(Date.now())
  const speakerIndexRef = useRef(0)
  const pauseThreshold = 5000

  // Check microphone permission state on mount
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
          if (trimmed.length > 1) {
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
      if (event.error === 'no-speech') return
      if (event.error === 'aborted') return
      if (event.error === 'not-allowed') {
        setMicPermission('denied')
        setError('not-allowed')
        recognitionRef.current = null
        setIsListening(false)
        return
      }
      setError(`Speech error: ${event.error}`)
    }

    recognition.onend = () => {
      if (recognitionRef.current) {
        try { recognition.start() } catch { /* ignore */ }
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
  }, [getSpeaker, onEntry, onInterim, onStart])

  const start = useCallback(async (language = 'en-US') => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }
    if (recognitionRef.current) return

    // Explicitly request mic access first. This triggers Chrome's
    // permission dialog if not yet decided, and surfaces a clear
    // error if the user has blocked it — rather than silently failing.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicPermission('granted')
      // Start recognition BEFORE releasing the getUserMedia stream.
      // Releasing it immediately causes a race condition where Chrome
      // sees the mic as "releasing" and SpeechRecognition silently fails.
      // Waiting 500 ms gives recognition time to claim the mic first.
      startRecognition(language)
      setTimeout(() => stream.getTracks().forEach(t => t.stop()), 500)
    } catch (err) {
      setMicPermission('denied')
      setError('not-allowed')
      return false  // signal to caller that we couldn't start
    }

    return true
  }, [isSupported, startRecognition])

  const stop = useCallback(() => {
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

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [])

  return { isSupported, isListening, error, micPermission, start, stop }
}
