import { useState, useEffect, useCallback, useRef } from 'react'
import { speechApiService, SpeechTranscriptionResult, SpeechAnalysisResult } from '../services/speechApiService'
import { audioProcessor, AudioChunk, AudioQualityMetrics } from '../utils/audioUtils'
import { transcriptionProcessor, ProcessedTranscription, TranscriptionSegment } from '../utils/transcriptionUtils'
import { logger } from '../utils/logger'

export interface UseBackendSpeechRecognitionOptions {
  language?: string
  enableRealTime?: boolean
  enableAnalysis?: boolean
  chunkSize?: number
  onTranscription?: (transcription: ProcessedTranscription) => void
  onAnalysis?: (analysis: SpeechAnalysisResult) => void
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
  
  // Audio quality
  audioQuality: AudioQualityMetrics | null
  isGoodQuality: boolean
  
  // Transcription data
  processedTranscription: ProcessedTranscription | null
  segments: TranscriptionSegment[]
  
  // Controls
  startListening: () => Promise<void>
  stopListening: () => Promise<void>
  pauseListening: () => void
  resumeListening: () => void
  reset: () => void
  
  // Connection management
  connect: () => Promise<void>
  disconnect: () => void
  
  // File upload
  uploadAudioFile: (file: File) => Promise<void>
  
  // Statistics
  stats: {
    totalDuration: number
    wordCount: number
    segmentCount: number
    averageConfidence: number
  }
}

export const useBackendSpeechRecognition = (
  options: UseBackendSpeechRecognitionOptions = {}
): UseBackendSpeechRecognitionReturn => {
  const {
    language = 'en-US',
    enableRealTime = true,
    enableAnalysis = true,
    chunkSize = 3000,
    onTranscription,
    onAnalysis,
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
  const [audioQuality, setAudioQuality] = useState<AudioQualityMetrics | null>(null)
  const [processedTranscription, setProcessedTranscription] = useState<ProcessedTranscription | null>(null)
  const [segments, setSegments] = useState<TranscriptionSegment[]>([])

  // Refs
  const processorRef = useRef(transcriptionProcessor)
  const startTimeRef = useRef<number>(0)
  const statsRef = useRef({
    totalDuration: 0,
    wordCount: 0,
    segmentCount: 0,
    averageConfidence: 0
  })

  // Initialize processor
  useEffect(() => {
    processorRef.current = new transcriptionProcessor()
  }, [])

  // Handle transcription results
  const handleTranscription = useCallback((result: SpeechTranscriptionResult) => {
    try {
      const processed = processorRef.current.processTranscriptionResult(result, startTimeRef.current)
      
      setTranscript(processed.fullText)
      setInterimTranscript(processorRef.current.getInterimTranscription())
      setConfidence(processed.confidence)
      setSegments(processed.segments)
      setProcessedTranscription(processed)
      
      // Update stats
      statsRef.current = {
        totalDuration: processed.duration,
        wordCount: processed.wordCount,
        segmentCount: processed.segments.length,
        averageConfidence: processed.confidence
      }
      
      onTranscription?.(processed)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Transcription processing failed')
      logger.error('Failed to process transcription:', error)
      setError(error.message)
      onError?.(error)
    }
  }, [onTranscription, onError])

  // Handle analysis results
  const handleAnalysis = useCallback((analysis: SpeechAnalysisResult) => {
    logger.info('Speech analysis completed:', analysis)
    onAnalysis?.(analysis)
  }, [onAnalysis])

  // Handle connection changes
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected)
    setIsConnecting(false)
    onConnectionChange?.(connected)
  }, [onConnectionChange])

  // Handle errors
  const handleError = useCallback((error: Error) => {
    logger.error('Speech recognition error:', error)
    setError(error.message)
    setIsListening(false)
    setIsPaused(false)
    onError?.(error)
  }, [onError])

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return

    setIsConnecting(true)
    setError(null)

    try {
      await speechApiService.connectWebSocket(
        handleTranscription,
        handleError,
        handleConnectionChange
      )
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect')
      handleError(error)
    }
  }, [isConnected, isConnecting, handleTranscription, handleError, handleConnectionChange])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    speechApiService.disconnectWebSocket()
    setIsConnected(false)
    setIsConnecting(false)
  }, [])

  // Start listening
  const startListening = useCallback(async () => {
    if (isListening) return

    setError(null)
    setIsPaused(false)
    startTimeRef.current = Date.now()

    try {
      // Connect if not already connected
      if (!isConnected && enableRealTime) {
        await connect()
      }

      // Start audio recording
      await audioProcessor.startRecording(
        async (chunk: AudioChunk) => {
          // Analyze audio quality
          try {
            const quality = await audioProcessor.analyzeAudioQuality(chunk.data)
            setAudioQuality(quality)
          } catch (err) {
            logger.warn('Failed to analyze audio quality:', err)
          }

          // Send to backend if connected
          if (isConnected && enableRealTime) {
            speechApiService.sendAudioData(chunk.data)
          }
        },
        (err: Error) => {
          handleError(err)
        }
      )

      setIsListening(true)
      logger.info('Started listening with backend speech recognition')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start listening')
      handleError(error)
    }
  }, [isListening, isConnected, enableRealTime, connect, handleError])

  // Stop listening
  const stopListening = useCallback(async () => {
    if (!isListening) return

    try {
      // Stop audio recording
      const audioBlob = await audioProcessor.stopRecording()
      
      // Process final transcription if not using real-time
      if (!enableRealTime || !isConnected) {
        const result = await speechApiService.transcribeAudio(audioBlob, {
          language,
          enableAnalysis
        })
        
        handleTranscription(result.transcription)
        
        if (result.analysis) {
          handleAnalysis(result.analysis)
        }
      }

      setIsListening(false)
      setIsPaused(false)
      logger.info('Stopped listening')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to stop listening')
      handleError(error)
    }
  }, [isListening, enableRealTime, isConnected, language, enableAnalysis, handleTranscription, handleAnalysis, handleError])

  // Pause listening
  const pauseListening = useCallback(() => {
    if (!isListening || isPaused) return
    
    setIsPaused(true)
    logger.info('Paused listening')
  }, [isListening, isPaused])

  // Resume listening
  const resumeListening = useCallback(() => {
    if (!isListening || !isPaused) return
    
    setIsPaused(false)
    logger.info('Resumed listening')
  }, [isListening, isPaused])

  // Reset everything
  const reset = useCallback(() => {
    processorRef.current.clear()
    setTranscript('')
    setInterimTranscript('')
    setConfidence(0)
    setError(null)
    setAudioQuality(null)
    setProcessedTranscription(null)
    setSegments([])
    setIsListening(false)
    setIsPaused(false)
    startTimeRef.current = 0
    statsRef.current = {
      totalDuration: 0,
      wordCount: 0,
      segmentCount: 0,
      averageConfidence: 0
    }
    logger.info('Reset speech recognition')
  }, [])

  // Upload audio file
  const uploadAudioFile = useCallback(async (file: File) => {
    setError(null)
    setIsConnecting(true)

    try {
      const result = await speechApiService.uploadAudioFile(file, {
        language,
        enableAnalysis
      })

      handleTranscription(result.transcription)
      
      if (result.analysis) {
        handleAnalysis(result.analysis)
      }

      logger.info('Audio file uploaded and processed successfully')
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to upload audio file')
      handleError(error)
    } finally {
      setIsConnecting(false)
    }
  }, [language, enableAnalysis, handleTranscription, handleAnalysis, handleError])

  // Auto-connect on mount if real-time is enabled
  useEffect(() => {
    if (enableRealTime && !isConnected && !isConnecting) {
      connect()
    }
  }, [enableRealTime, isConnected, isConnecting, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopListening()
      }
      disconnect()
      audioProcessor.cleanup()
    }
  }, [isListening, stopListening, disconnect])

  // Calculate derived state
  const isGoodQuality = audioQuality?.isGoodQuality ?? false

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
    
    // Audio quality
    audioQuality,
    isGoodQuality,
    
    // Transcription data
    processedTranscription,
    segments,
    
    // Controls
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    reset,
    
    // Connection management
    connect,
    disconnect,
    
    // File upload
    uploadAudioFile,
    
    // Statistics
    stats: statsRef.current
  }
}
