import React, { useState, useRef, useCallback, useEffect } from 'react'
import { TranscriptionResponse } from '../../types/fileOperations'
import { speechService } from '../../services/speechService'
import { logger } from '../../utils/logger'

interface EnhancedAudioRecorderProps {
  onTranscriptionComplete: (transcription: string, confidence: number) => void
  onTranscriptionError: (error: string) => void
  onRecordingComplete?: (audioBlob: Blob) => void
  className?: string
  disabled?: boolean
  autoTranscribe?: boolean
  maxDuration?: number // in seconds
}

interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob: Blob | null
  audioUrl: string | null
}

export const EnhancedAudioRecorder: React.FC<EnhancedAudioRecorderProps> = ({
  onTranscriptionComplete,
  onTranscriptionError,
  onRecordingComplete,
  className = '',
  disabled = false,
  autoTranscribe = true,
  maxDuration = 300 // 5 minutes default
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null
  })
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (recordingState.audioUrl) {
        URL.revokeObjectURL(recordingState.audioUrl)
      }
    }
  }, [recordingState.audioUrl])

  const startRecording = useCallback(async () => {
    if (disabled || recordingState.isRecording) return

    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        setRecordingState(prev => ({
          ...prev,
          audioBlob,
          audioUrl,
          isRecording: false,
          isPaused: false
        }))

        onRecordingComplete?.(audioBlob)
        
        // Auto-transcribe if enabled
        if (autoTranscribe) {
          transcribeAudio(audioBlob)
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(1000) // Collect data every second
      
      setRecordingState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0
      }))

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setRecordingState(prev => {
          const newDuration = prev.duration + 1
          if (newDuration >= maxDuration) {
            stopRecording()
            return prev
          }
          return { ...prev, duration: newDuration }
        })
      }, 1000)

      logger.info('Recording started')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording'
      setError(errorMessage)
      onTranscriptionError(errorMessage)
      logger.error('Failed to start recording:', error)
    }
  }, [disabled, recordingState.isRecording, maxDuration, autoTranscribe, onRecordingComplete, onTranscriptionError])

  const stopRecording = useCallback(() => {
    if (!recordingState.isRecording || !mediaRecorderRef.current) return

    mediaRecorderRef.current.stop()
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    logger.info('Recording stopped')
  }, [recordingState.isRecording])

  const pauseRecording = useCallback(() => {
    if (!recordingState.isRecording || !mediaRecorderRef.current || recordingState.isPaused) return

    mediaRecorderRef.current.pause()
    setRecordingState(prev => ({ ...prev, isPaused: true }))
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    logger.info('Recording paused')
  }, [recordingState.isRecording, recordingState.isPaused])

  const resumeRecording = useCallback(() => {
    if (!recordingState.isRecording || !mediaRecorderRef.current || !recordingState.isPaused) return

    mediaRecorderRef.current.resume()
    setRecordingState(prev => ({ ...prev, isPaused: false }))
    
    // Resume duration timer
    intervalRef.current = setInterval(() => {
      setRecordingState(prev => {
        const newDuration = prev.duration + 1
        if (newDuration >= maxDuration) {
          stopRecording()
          return prev
        }
        return { ...prev, duration: newDuration }
      })
    }, 1000)

    logger.info('Recording resumed')
  }, [recordingState.isRecording, recordingState.isPaused, maxDuration, stopRecording])

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true)
    setError(null)

    try {
      // Convert Blob to File
      const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })
      
      const response = await speechService.transcribeAudio(audioFile, 'en-US', false)
      
      setTranscriptionResult(response)
      onTranscriptionComplete(response.transcription, response.confidence)
      
      logger.info('Transcription completed', { confidence: response.confidence })
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'userMessage' in error 
        ? (error as any).userMessage 
        : 'Transcription failed'
      setError(errorMessage)
      onTranscriptionError(errorMessage)
      logger.error('Transcription failed:', error)
    } finally {
      setIsTranscribing(false)
    }
  }, [onTranscriptionComplete, onTranscriptionError])

  const clearRecording = useCallback(() => {
    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl)
    }
    
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null
    })
    setTranscriptionResult(null)
    setError(null)
  }, [recordingState.audioUrl])

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceDescription = (confidence: number): string => {
    return speechService.getConfidenceDescription(confidence)
  }

  return (
    <div className={`enhanced-audio-recorder ${className}`}>
      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        {!recordingState.isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-xl">🎤</span>
            <span>Start Recording</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={recordingState.isPaused ? resumeRecording : pauseRecording}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 transition-colors"
            >
              <span className="text-lg">
                {recordingState.isPaused ? '▶️' : '⏸️'}
              </span>
              <span>{recordingState.isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            
            <button
              onClick={stopRecording}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors"
            >
              <span className="text-lg">⏹️</span>
              <span>Stop</span>
            </button>
          </div>
        )}
      </div>

      {/* Recording Status */}
      {recordingState.isRecording && (
        <div className="text-center mb-4">
          <div className="text-lg font-medium text-gray-700">
            {recordingState.isPaused ? 'Recording Paused' : 'Recording...'}
          </div>
          <div className="text-2xl font-mono text-red-600">
            {formatDuration(recordingState.duration)}
          </div>
          <div className="text-sm text-gray-500">
            Max duration: {formatDuration(maxDuration)}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Audio Playback */}
      {recordingState.audioUrl && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Recording Playback</span>
            <button
              onClick={clearRecording}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          
          <audio
            ref={audioRef}
            controls
            src={recordingState.audioUrl}
            className="w-full"
          />
          
          <div className="mt-2 text-xs text-gray-500">
            Duration: {formatDuration(recordingState.duration)}
          </div>
        </div>
      )}

      {/* Transcription Status */}
      {isTranscribing && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-800">Transcribing audio...</span>
          </div>
        </div>
      )}

      {/* Transcription Result */}
      {transcriptionResult && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-800">Transcription Result</span>
            <span className={`text-xs ${getConfidenceColor(transcriptionResult.confidence)}`}>
              {getConfidenceDescription(transcriptionResult.confidence)} confidence
            </span>
          </div>
          
          <div className="text-sm text-gray-700 bg-white p-3 rounded border">
            {transcriptionResult.transcription}
          </div>
        </div>
      )}

      {/* Manual Transcription Button */}
      {recordingState.audioBlob && !autoTranscribe && !isTranscribing && (
        <div className="text-center">
          <button
            onClick={() => transcribeAudio(recordingState.audioBlob!)}
            disabled={disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Transcribe Audio
          </button>
        </div>
      )}
    </div>
  )
}
