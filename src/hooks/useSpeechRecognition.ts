import { useState, useEffect, useRef } from 'react'
import { isSpeechRecognitionSupported, getSpeechRecognition } from '../utils/browserUtils'
import { processTranscriptResults } from '../utils/transcriptUtils'
import { SPEECH_RECOGNITION_CONFIG } from '../constants/appConstants'
import { apiService } from '../services/apiService'
import { logger } from '../utils/logger'

interface SpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
  useBackendAPI?: boolean
  onBackendTranscription?: (result: any) => void
  onBackendError?: (error: Error) => void
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
  uploadAudioFile?: (file: File) => Promise<any>
}

export const useSpeechRecognition = (options: SpeechRecognitionOptions = {}): UseSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState<boolean>(false)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [transcript, setTranscript] = useState<string>('')
  const [interimTranscript, setInterimTranscript] = useState<string>('')
  const [error, setError] = useState<string>('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const {
    lang = SPEECH_RECOGNITION_CONFIG.lang,
    continuous = SPEECH_RECOGNITION_CONFIG.continuous,
    interimResults = SPEECH_RECOGNITION_CONFIG.interimResults,
    maxAlternatives = SPEECH_RECOGNITION_CONFIG.maxAlternatives,
    useBackendAPI = false,
    onBackendTranscription,
    onBackendError
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

  // Backend API integration methods
  const uploadAudioFile = async (file: File): Promise<any> => {
    try {
      setError('')
      logger.info('Uploading audio file for backend transcription:', { fileName: file.name })
      
      const result = await apiService.uploadAudioFile(file, lang)
      
      // Update transcript with backend result
      setTranscript(result.transcript)
      setInterimTranscript('')
      
      // Call callback if provided
      onBackendTranscription?.(result)
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Backend transcription failed')
      logger.error('Backend transcription failed:', error)
      setError(error.message)
      onBackendError?.(error)
      throw error
    }
  }

  // Enhanced start listening with backend API support
  const startListeningWithBackend = async (): Promise<void> => {
    if (useBackendAPI) {
      try {
        setError('')
        
        // Get user media for recording
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 44100,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })

        // Set up MediaRecorder for backend API
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 128000
        })

        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
            const result = await apiService.transcribeAudio({
              audio: audioBlob,
              language: lang,
              realTime: false
            })
            
            // Update transcript with backend result
            setTranscript(result.transcript)
            setInterimTranscript('')
            
            // Call callback if provided
            onBackendTranscription?.(result)
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Backend transcription failed')
            logger.error('Backend transcription failed:', error)
            setError(error.message)
            onBackendError?.(error)
          }
        }

        mediaRecorder.start(1000) // Collect data every second
        setIsListening(true)
        
        logger.info('Started recording for backend transcription')
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to start backend recording')
        logger.error('Failed to start backend recording:', error)
        setError(error.message)
        onBackendError?.(error)
      }
    } else {
      // Use browser speech recognition
      startListening()
    }
  }

  // Enhanced stop listening with backend API support
  const stopListeningWithBackend = (): void => {
    if (useBackendAPI && mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      setIsListening(false)
      logger.info('Stopped recording for backend transcription')
    } else {
      // Use browser speech recognition
      stopListening()
    }
  }

  const returnValue: UseSpeechRecognitionReturn = {
    isListening,
    isPaused,
    transcript,
    interimTranscript,
    error,
    startListening: useBackendAPI ? startListeningWithBackend : startListening,
    stopListening: useBackendAPI ? stopListeningWithBackend : stopListening,
    pauseListening,
    resumeListening,
    reset
  }

  if (useBackendAPI) {
    returnValue.uploadAudioFile = uploadAudioFile
  }

  return returnValue
} 