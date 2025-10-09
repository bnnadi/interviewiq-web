import { useState, useEffect, useRef } from 'react'
import { isSpeechRecognitionSupported, getSpeechRecognition } from '../utils/browserUtils'
import { processTranscriptResults } from '../utils/transcriptUtils'
import { SPEECH_RECOGNITION_CONFIG } from '../constants/appConstants'

interface SpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
}

interface UseSpeechRecognitionReturn {
  isListening: boolean
  isPaused: boolean
  transcript: string
  interimTranscript: string
  error: string
  startListening: () => void
  stopListening: () => void
  pauseListening: () => void
  resumeListening: () => void
  reset: () => void
}

export const useSpeechRecognition = (options: SpeechRecognitionOptions = {}): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [transcript, setTranscript] = useState<string>('')
  const [interimTranscript, setInterimTranscript] = useState<string>('')
  const [error, setError] = useState<string>('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const {
    lang = SPEECH_RECOGNITION_CONFIG.lang,
    continuous = SPEECH_RECOGNITION_CONFIG.continuous,
    interimResults = SPEECH_RECOGNITION_CONFIG.interimResults,
    maxAlternatives = SPEECH_RECOGNITION_CONFIG.maxAlternatives
  } = options

  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      setError('Speech recognition is not supported in this browser')
      return
    }

    const SpeechRecognition = getSpeechRecognition()
    recognitionRef.current = new SpeechRecognition()
    
    const recognition = recognitionRef.current
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = lang
    recognition.maxAlternatives = maxAlternatives

    recognition.onstart = () => {
      setIsListening(true)
      setIsPaused(false)
      setError('')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const { finalTranscript, interimTranscript } = processTranscriptResults(event)
      setTranscript(prev => prev + finalTranscript)
      setInterimTranscript(interimTranscript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`Speech recognition error: ${event.error}`)
      setIsListening(false)
      setIsPaused(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      setIsPaused(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [lang, continuous, interimResults, maxAlternatives])

  const startListening = (): void => {
    if (recognitionRef.current) {
      setTranscript('')
      setInterimTranscript('')
      setError('')
      recognitionRef.current.start()
    }
  }

  const stopListening = (): void => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const pauseListening = (): void => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsPaused(true)
    }
  }

  const resumeListening = (): void => {
    if (isPaused) {
      startListening()
    }
  }

  const reset = (): void => {
    setTranscript('')
    setInterimTranscript('')
    setError('')
    setIsPaused(false)
  }

  return {
    isListening,
    isPaused,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    reset
  }
} 