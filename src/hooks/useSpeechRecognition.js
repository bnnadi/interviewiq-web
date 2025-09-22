import { useState, useEffect, useRef } from 'react'
import { isSpeechRecognitionSupported, getSpeechRecognition } from '../utils/browserUtils.js'
import { processTranscriptResults } from '../utils/transcriptUtils.js'
import { SPEECH_RECOGNITION_CONFIG } from '../constants/appConstants.js'

export const useSpeechRecognition = (options = {}) => {
  const [isListening, setIsListening] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

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

    recognition.onresult = (event) => {
      const { finalTranscript, interimTranscript } = processTranscriptResults(event)
      setTranscript(prev => prev + finalTranscript)
      setInterimTranscript(interimTranscript)
    }

    recognition.onerror = (event) => {
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

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('')
      setInterimTranscript('')
      setError('')
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const pauseListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsPaused(true)
    }
  }

  const resumeListening = () => {
    if (isPaused) {
      startListening()
    }
  }

  const reset = () => {
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