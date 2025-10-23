import { useState, useCallback, useRef, useEffect } from 'react'
import { speechApiService, SpeechTranscriptionResponse, RealTimeTranscriptionEvent } from '../services/speechApiService'
import { logger } from '../utils/logger'

export interface UseBackendSpeechRecognitionOptions {
  language?: string
  enableRealTime?: boolean
  enableAnalysis?: boolean
  chunkSize?: number
  onTranscription?: (result: SpeechTranscriptionResponse) => void
  onAnalysis?: (analysis: any) => void
  onError?: (error: Error) => void
  onConnectionChange?: (connected: boolean) => void
}

export interface UseBackendSpeechRecognitionReturn {
  // State
  isListening: boolean
  isPaused: boolean
  isConnected: boolean
  isConnecting: boolean
  transcript: string
  interimTranscript: string
  confidence: number
  error: string | null
  
  // Audio quality metrics
  audioQuality: {
    volume: number
    noiseLevel: number
    clarity: number
    isGoodQuality: boolean
  } | null
  
  // Transcription data
  processedTranscription: {
    fullText: string
    segments: any[]
    confidence: number
    wordCount: number
    duration: number
  } | null
  
  segments: any[]
  
  // Statistics
  stats: {
    totalDuration: number
    wordCount: number
    segmentCount: number
    averageConfidence: number
  }
  
  // Actions
  startListening: () => Promise<void>
  stopListening: () => Promise<void>
  pauseListening: () => void
  resumeListening: () => void
  clearTranscript: () => void
  reset: () => void
  uploadAudioFile: (file: File) => Promise<SpeechTranscriptionResponse>
  
  // Real-time features
  startRealTimeTranscription: () => Promise<void>
  stopRealTimeTranscription: () => Promise<void>
  sendAudioChunk: (chunk: Blob) => Promise<void>
  
  // Utility functions
  getSupportedLanguages: () => Promise<string[]>
  getSupportedFormats: () => Promise<string[]>
}

export const useBackendSpeechRecognition = (
  options: UseBackendSpeechRecognitionOptions = {}
): UseBackendSpeechRecognitionReturn => {
  const {
    language = 'en-US',
    enableRealTime = true,
    chunkSize = 3000,
    onTranscription,
    onError,
    onConnectionChange
  } = options

  // State
  const [isListening, setIsListening] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [audioQuality] = useState<{
    volume: number
    noiseLevel: number
    clarity: number
    isGoodQuality: boolean
  } | null>(null)
  const [processedTranscription, setProcessedTranscription] = useState<{
    fullText: string
    segments: any[]
    confidence: number
    wordCount: number
    duration: number
  } | null>(null)
  const [segments, setSegments] = useState<any[]>([])

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const statsRef = useRef({
    totalDuration: 0,
    wordCount: 0,
    segmentCount: 0,
    averageConfidence: 0
  })

  // Handle transcription results
  const handleTranscription = useCallback((result: SpeechTranscriptionResponse) => {
    try {
      logger.info('Received transcription result:', { 
        confidence: result.confidence,
        isFinal: result.isFinal,
        duration: result.duration 
      })

      if (result.isFinal) {
        setTranscript(prev => prev + (prev ? ' ' : '') + result.transcript)
        setInterimTranscript('')
        
        // Update segments
        if (result.segments && Array.isArray(result.segments)) {
          setSegments(prev => [...prev, ...(result.segments as any[])])
        }
        
        // Update processed transcription
        setProcessedTranscription(prev => {
          const newText = (prev?.fullText || '') + (prev?.fullText ? ' ' : '') + result.transcript
          const newSegments = [...(prev?.segments || []), ...(result.segments && Array.isArray(result.segments) ? (result.segments as any[]) : [])]
          const newWordCount = newText.split(/\s+/).filter(word => word.length > 0).length
          const newDuration = (prev?.duration || 0) + result.duration
          const newConfidence = newSegments.length > 0 
            ? newSegments.reduce((sum, seg) => sum + seg.confidence, 0) / newSegments.length
            : result.confidence

          return {
            fullText: newText,
            segments: newSegments,
            confidence: newConfidence,
            wordCount: newWordCount,
            duration: newDuration
          }
        })
      } else {
        setInterimTranscript(result.transcript)
      }

      setConfidence(result.confidence)
      
      // Update stats
      statsRef.current = {
        totalDuration: processedTranscription?.duration || 0,
        wordCount: processedTranscription?.wordCount || 0,
        segmentCount: segments.length,
        averageConfidence: result.confidence
      }

      onTranscription?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to process transcription')
      logger.error('Failed to process transcription:', error)
      setError(error.message)
      onError?.(error)
    }
  }, [onTranscription, onError, processedTranscription, segments])

  // Handle real-time transcription events
  const handleRealTimeEvent = useCallback((event: RealTimeTranscriptionEvent) => {
    try {
      if (event.type === 'error') {
        const error = new Error('Real-time transcription error')
        logger.error('Real-time transcription error:', error)
        setError(error.message)
        onError?.(error)
        return
      }

      handleTranscription(event.data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to handle real-time event')
      logger.error('Failed to handle real-time event:', error)
      setError(error.message)
      onError?.(error)
    }
  }, [handleTranscription, onError])

  // Start listening with backend API
  const startListening = useCallback(async () => {
    try {
      if (isListening) {
        logger.warn('Already listening')
        return
      }

      setIsConnecting(true)
      setError(null)

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      audioStreamRef.current = stream
      startTimeRef.current = Date.now()

      if (enableRealTime) {
        // Start real-time transcription
        await startRealTimeTranscription()
      } else {
        // Start regular recording
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
            const result = await speechApiService.transcribeAudio({
              audio: audioBlob,
              language,
              realTime: false
            })
            handleTranscription(result)
          } catch (err) {
            const error = err instanceof Error ? err : new Error('Transcription failed')
            logger.error('Transcription failed:', error)
            setError(error.message)
            onError?.(error)
          }
        }

        mediaRecorder.start(chunkSize)
      }

      setIsListening(true)
      setIsConnecting(false)
      setIsConnected(true)
      onConnectionChange?.(true)

      logger.info('Started listening with backend API')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start listening')
      logger.error('Failed to start listening:', error)
      setError(error.message)
      setIsConnecting(false)
      onError?.(error)
    }
  }, [isListening, enableRealTime, language, chunkSize, onError, onConnectionChange])

  // Stop listening
  const stopListening = useCallback(async () => {
    try {
      if (!isListening) {
        logger.warn('Not currently listening')
        return
      }

      if (enableRealTime && wsRef.current) {
        await speechApiService.stopRealTimeTranscription(wsRef.current)
        wsRef.current = null
      } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }

      // Stop audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
        audioStreamRef.current = null
      }

      setIsListening(false)
      setIsPaused(false)
      setIsConnected(false)
      onConnectionChange?.(false)

      logger.info('Stopped listening')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to stop listening')
      logger.error('Failed to stop listening:', error)
      setError(error.message)
      onError?.(error)
    }
  }, [isListening, enableRealTime, onError, onConnectionChange])

  // Pause listening
  const pauseListening = useCallback(() => {
    if (isListening && !isPaused) {
      setIsPaused(true)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause()
      }
      logger.info('Paused listening')
    }
  }, [isListening, isPaused])

  // Resume listening
  const resumeListening = useCallback(() => {
    if (isListening && isPaused) {
      setIsPaused(false)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume()
      }
      logger.info('Resumed listening')
    }
  }, [isListening, isPaused])

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setSegments([])
    setProcessedTranscription(null)
    setConfidence(0)
    setError(null)
    statsRef.current = {
      totalDuration: 0,
      wordCount: 0,
      segmentCount: 0,
      averageConfidence: 0
    }
    logger.info('Cleared transcript')
  }, [])

  // Reset method for compatibility
  const reset = useCallback(() => {
    clearTranscript()
  }, [clearTranscript])

  // Upload audio file
  const uploadAudioFile = useCallback(async (file: File): Promise<SpeechTranscriptionResponse> => {
    try {
      setError(null)
      logger.info('Uploading audio file:', { fileName: file.name, fileSize: file.size })
      
      const result = await speechApiService.uploadAudioFile(file, language)
      handleTranscription(result)
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Audio upload failed')
      logger.error('Audio upload failed:', error)
      setError(error.message)
      onError?.(error)
      throw error
    }
  }, [language, handleTranscription, onError])

  // Start real-time transcription
  const startRealTimeTranscription = useCallback(async () => {
    try {
      if (!audioStreamRef.current) {
        throw new Error('No audio stream available')
      }

      const ws = await speechApiService.startRealTimeTranscription(
        {
          audio: new Blob(), // Empty blob for initial connection
          language,
          realTime: true
        },
        handleRealTimeEvent
      )

      wsRef.current = ws

      // Set up MediaRecorder to send chunks
      const mediaRecorder = new MediaRecorder(audioStreamRef.current, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && wsRef.current) {
          try {
            await speechApiService.sendAudioChunk(wsRef.current, event.data)
          } catch (err) {
            logger.error('Failed to send audio chunk:', err)
          }
        }
      }

      mediaRecorder.start(chunkSize)
      logger.info('Started real-time transcription')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start real-time transcription')
      logger.error('Failed to start real-time transcription:', error)
      setError(error.message)
      onError?.(error)
      throw error
    }
  }, [language, chunkSize, handleRealTimeEvent, onError])

  // Stop real-time transcription
  const stopRealTimeTranscription = useCallback(async () => {
    try {
      if (wsRef.current) {
        await speechApiService.stopRealTimeTranscription(wsRef.current)
        wsRef.current = null
      }
      logger.info('Stopped real-time transcription')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to stop real-time transcription')
      logger.error('Failed to stop real-time transcription:', error)
      setError(error.message)
      onError?.(error)
    }
  }, [onError])

  // Send audio chunk
  const sendAudioChunk = useCallback(async (chunk: Blob) => {
    try {
      if (wsRef.current) {
        await speechApiService.sendAudioChunk(wsRef.current, chunk)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send audio chunk')
      logger.error('Failed to send audio chunk:', error)
      setError(error.message)
      onError?.(error)
    }
  }, [onError])

  // Get supported languages
  const getSupportedLanguages = useCallback(async (): Promise<string[]> => {
    try {
      return await speechApiService.getSupportedLanguages()
    } catch (err) {
      logger.warn('Failed to get supported languages:', err)
      return ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE']
    }
  }, [])

  // Get supported formats
  const getSupportedFormats = useCallback(async (): Promise<string[]> => {
    try {
      return await speechApiService.getSupportedFormats()
    } catch (err) {
      logger.warn('Failed to get supported formats:', err)
      return ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a']
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return {
    // State
    isListening,
    isPaused,
    isConnected,
    isConnecting,
    transcript,
    interimTranscript,
    confidence,
    error,
    audioQuality,
    processedTranscription,
    segments,
    
    // Statistics
    stats: statsRef.current,
    
    // Actions
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    clearTranscript,
    reset,
    uploadAudioFile,
    
    // Real-time features
    startRealTimeTranscription,
    stopRealTimeTranscription,
    sendAudioChunk,
    
    // Utility functions
    getSupportedLanguages,
    getSupportedFormats
  }
}