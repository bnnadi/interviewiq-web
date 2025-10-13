import React, { useState, useEffect } from 'react'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import LoadingSpinner from '@components/shared/ui/LoadingSpinner'
import ErrorMessage from '@components/shared/ui/ErrorMessage'
import { useBackendSpeechRecognition } from '../../hooks/useBackendSpeechRecognition'
import { ProcessedTranscription, TranscriptionSegment } from '../../utils/transcriptionUtils'
import { formatDuration } from '../../utils/audioUtils'

interface BackendTranscriberProps {
  onTranscriptionComplete?: (transcription: ProcessedTranscription) => void
  onTranscriptionUpdate?: (transcription: ProcessedTranscription) => void
  onError?: (error: string) => void
  language?: string
  enableRealTime?: boolean
  enableAnalysis?: boolean
  className?: string
}

const BackendTranscriber: React.FC<BackendTranscriberProps> = ({
  onTranscriptionComplete,
  onTranscriptionUpdate,
  onError,
  language = 'en-US',
  enableRealTime = true,
  enableAnalysis = true,
  className = ''
}) => {
  const [showSegments, setShowSegments] = useState(false)
  const [showQuality, setShowQuality] = useState(false)

  const {
    isListening,
    isPaused,
    isConnected,
    isConnecting,
    transcript,
    interimTranscript,
    confidence,
    error,
    audioQuality,
    isGoodQuality,
    processedTranscription,
    segments,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    reset,
    connect,
    disconnect,
    uploadAudioFile,
    stats
  } = useBackendSpeechRecognition({
    language,
    enableRealTime,
    enableAnalysis,
    onTranscription: onTranscriptionUpdate,
    onError: (err) => onError?.(err.message)
  })

  // Handle transcription updates
  useEffect(() => {
    if (processedTranscription) {
      onTranscriptionUpdate?.(processedTranscription)
    }
  }, [processedTranscription, onTranscriptionUpdate])

  // Handle errors
  useEffect(() => {
    if (error) {
      onError?.(error)
    }
  }, [error, onError])

  const handleStart = async () => {
    try {
      await startListening()
    } catch (err) {
      console.error('Failed to start listening:', err)
    }
  }

  const handleStop = async () => {
    try {
      await stopListening()
      if (processedTranscription) {
        onTranscriptionComplete?.(processedTranscription)
      }
    } catch (err) {
      console.error('Failed to stop listening:', err)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        await uploadAudioFile(file)
        if (processedTranscription) {
          onTranscriptionComplete?.(processedTranscription)
        }
      } catch (err) {
        console.error('Failed to upload file:', err)
      }
    }
  }

  const getStatusColor = () => {
    if (error) return 'text-red-600'
    if (isListening) return 'text-green-600'
    if (isConnecting) return 'text-blue-600'
    if (isConnected) return 'text-green-500'
    return 'text-gray-600'
  }

  const getStatusText = () => {
    if (error) return 'Error'
    if (isListening && isPaused) return 'Paused'
    if (isListening) return 'Listening...'
    if (isConnecting) return 'Connecting...'
    if (isConnected) return 'Ready'
    return 'Disconnected'
  }

  const getQualityColor = () => {
    if (!audioQuality) return 'text-gray-500'
    if (isGoodQuality) return 'text-green-600'
    if (audioQuality.clarity > 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getQualityText = () => {
    if (!audioQuality) return 'Unknown'
    if (isGoodQuality) return 'Good'
    if (audioQuality.clarity > 0.5) return 'Fair'
    return 'Poor'
  }

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Backend Transcription</h3>
        <div className="flex items-center space-x-2">
          <div className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div>
          {isConnecting && <LoadingSpinner />}
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 
              isConnecting ? 'bg-blue-500' : 
              'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={connect}
              disabled={isConnected || isConnecting}
              variant="outline"
              size="sm"
            >
              Connect
            </Button>
            <Button
              onClick={disconnect}
              disabled={!isConnected}
              variant="outline"
              size="sm"
            >
              Disconnect
            </Button>
          </div>
        </div>
      </div>

      {/* Audio Quality */}
      {audioQuality && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getQualityColor()}`} />
              <span className="text-sm font-medium text-gray-700">
                Audio Quality: <span className={getQualityColor()}>{getQualityText()}</span>
              </span>
            </div>
            <button
              onClick={() => setShowQuality(!showQuality)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showQuality ? 'Hide' : 'Show'} Details
            </button>
          </div>
          {showQuality && (
            <div className="mt-2 text-xs text-gray-600 space-y-1">
              <div>Volume: {Math.round(audioQuality.volume * 100)}%</div>
              <div>Clarity: {Math.round(audioQuality.clarity * 100)}%</div>
              <div>Noise Level: {Math.round(audioQuality.noiseLevel * 100)}%</div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <ErrorMessage 
            error={error}
            onDismiss={() => {}}
            showNetworkStatus={false}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          onClick={handleStart}
          disabled={isListening || isConnecting}
          className="flex-1 min-w-0"
        >
          {isListening ? 'Recording...' : 'Start Recording'}
        </Button>
        
        {isListening && (
          <>
            <Button
              onClick={isPaused ? resumeListening : pauseListening}
              variant="outline"
              className="flex-1 min-w-0"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              onClick={handleStop}
              variant="outline"
              className="flex-1 min-w-0"
            >
              Stop
            </Button>
          </>
        )}
        
        <Button
          onClick={reset}
          variant="outline"
          disabled={isListening}
        >
          Reset
        </Button>
      </div>

      {/* File Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or upload audio file
        </label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          disabled={isListening || isConnecting}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Transcription Display */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Transcription
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {confidence > 0 && `${Math.round(confidence * 100)}% confidence`}
            </span>
            <button
              onClick={() => setShowSegments(!showSegments)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showSegments ? 'Hide' : 'Show'} Segments
            </button>
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-lg min-h-[100px]">
          {transcript ? (
            <div className="space-y-2">
              <div className="text-gray-900">
                {transcript}
                {interimTranscript && (
                  <span className="text-gray-500 italic">
                    {interimTranscript}
                  </span>
                )}
              </div>
              
              {showSegments && segments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-2">Segments:</div>
                  <div className="space-y-1">
                    {segments.map((segment, index) => (
                      <div key={index} className="text-xs text-gray-700">
                        <span className="font-medium">[{formatDuration(segment.startTime)}]</span>
                        <span className="ml-2">{segment.text}</span>
                        <span className="ml-2 text-gray-500">
                          ({Math.round(segment.confidence * 100)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              {isListening ? 'Listening...' : 'Start recording to see transcription'}
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      {stats.totalDuration > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">Statistics</div>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>Duration: {formatDuration(stats.totalDuration)}</div>
            <div>Words: {stats.wordCount}</div>
            <div>Segments: {stats.segmentCount}</div>
            <div>Avg Confidence: {Math.round(stats.averageConfidence * 100)}%</div>
          </div>
        </div>
      )}
    </Card>
  )
}

export default BackendTranscriber
