import { useRef, useState, useCallback, useEffect } from 'react'
import { generateId, speakerColor } from '../utils/nlp.js'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export function useSpeechRecognition({ onEntry, onInterim, settings }) {
  const recognitionRef = useRef(null)
  const [isSupported] = useState(() => !!SpeechRecognition)
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)

  const lastSpeechRef = useRef(Date.now())
  const speakerIndexRef = useRef(0)
  const pauseThreshold = 5000 // ms between segments = potential speaker change

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

  const start = useCallback((language = 'en-US') => {
    if (!isSupported) {
      setError('Speech recognition not supported in this browser. Try Chrome or Edge.')
      return
    }
    if (recognitionRef.current) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
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
      setError(`Speech error: ${event.error}`)
    }

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
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
  }, [isSupported, getSpeaker, onEntry, onInterim])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      const r = recognitionRef.current
      recognitionRef.current = null
      r.stop()
    }
    setIsListening(false)
    onInterim('')
    // Reset speaker tracking for next session
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

  return { isSupported, isListening, error, start, stop }
}
