import React, { useState, useEffect, useCallback } from 'react'
import { useBackendSpeechRecognition } from '../../hooks/useBackendSpeechRecognition'
import { SpeechTranscriptionResponse } from '../../services/speechApiService'
import { logger } from '../../utils/logger'
import Button from '../shared/ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Badge } from '../ui/Badge'
// import { Progress } from '../ui/Progress' // Unused for now

export interface BackendTranscriberProps {
  language?: string
  enableRealTime?: boolean
  enableAnalysis?: boolean
  onTranscriptionComplete?: (result: SpeechTranscriptionResponse) => void
  onError?: (error: Error) => void
  className?: string
  showControls?: boolean
  showStats?: boolean
  showQuality?: boolean
  autoStart?: boolean
}

export const BackendTranscriber: React.FC<BackendTranscriberProps> = ({
  language = 'en-US',
  enableRealTime = true,
  enableAnalysis = true,
  onTranscriptionComplete,
  onError,
  className = '',
  showControls = true,
  showStats = true,
  showQuality = true,
  autoStart = false
}) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([])
  const [supportedFormats, setSupportedFormats] = useState<string[]>([])

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
    processedTranscription,
    segments,
    stats,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    clearTranscript,
    uploadAudioFile,
    getSupportedLanguages,
    getSupportedFormats
  } = useBackendSpeechRecognition({
    language,
    enableRealTime,
    enableAnalysis,
    onTranscription: (result) => {
      if (result.isFinal) {
        onTranscriptionComplete?.(result)
      }
    },
    onError: (error) => {
      logger.error('Backend transcription error:', error)
      onError?.(error)
    }
  })

  // Initialize supported languages and formats
  useEffect(() => {
    const initialize = async () => {
      try {
        const [languages, formats] = await Promise.all([
          getSupportedLanguages(),
          getSupportedFormats()
        ])
        setSupportedLanguages(languages)
        setSupportedFormats(formats)
        setIsInitialized(true)
      } catch (err) {
        logger.error('Failed to initialize backend transcriber:', err)
        setIsInitialized(true) // Continue with defaults
      }
    }

    initialize()
  }, [getSupportedLanguages, getSupportedFormats])

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && isInitialized && !isListening && !isConnecting) {
      startListening()
    }
  }, [autoStart, isInitialized, isListening, isConnecting, startListening])

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      await uploadAudioFile(file)
    } catch (err) {
      logger.error('File upload failed:', err)
    }
  }, [uploadAudioFile])

  // Handle start/stop
  const handleToggleListening = useCallback(async () => {
    try {
      if (isListening) {
        await stopListening()
      } else {
        await startListening()
      }
    } catch (err) {
      logger.error('Failed to toggle listening:', err)
    }
  }, [isListening, startListening, stopListening])

  // Handle pause/resume
  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      resumeListening()
    } else {
      pauseListening()
    }
  }, [isPaused, pauseListening, resumeListening])

  // Get connection status color
  const getConnectionStatusColor = () => {
    if (isConnecting) return 'bg-yellow-500'
    if (isConnected) return 'bg-green-500'
    if (error) return 'bg-red-500'
    return 'bg-gray-500'
  }

  // Get connection status text
  const getConnectionStatusText = () => {
    if (isConnecting) return 'Connecting...'
    if (isConnected) return 'Connected'
    if (error) return 'Error'
    return 'Disconnected'
  }

  // Get confidence color
  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-green-600'
    if (conf >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Get quality indicator
  const getQualityIndicator = () => {
    if (!audioQuality) return null

    const { volume, noiseLevel, clarity, isGoodQuality } = audioQuality
    const qualityColor = isGoodQuality ? 'text-green-600' : 'text-yellow-600'
    const qualityText = isGoodQuality ? 'Good' : 'Fair'

    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">Quality:</span>
        <span className={`text-sm font-medium ${qualityColor}`}>{qualityText}</span>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full" title={`Volume: ${Math.round(volume * 100)}%`} />
          <div className="w-2 h-2 bg-orange-500 rounded-full" title={`Noise: ${Math.round(noiseLevel * 100)}%`} />
          <div className="w-2 h-2 bg-purple-500 rounded-full" title={`Clarity: ${Math.round(clarity * 100)}%`} />
        </div>
      </div>
    )
  }

  if (!isInitialized) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Initializing...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Backend Speech Recognition</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`} />
            <span className="text-sm text-gray-600">{getConnectionStatusText()}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleToggleListening}
              disabled={isConnecting}
              variant={isListening ? 'destructive' : 'primary'}
              className="flex items-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </>
              ) : isListening ? (
                <>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Start</span>
                </>
              )}
            </Button>

            {isListening && (
              <Button
                onClick={handleTogglePause}
                variant="outline"
                size="sm"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            )}

            <Button
              onClick={clearTranscript}
              variant="outline"
              size="sm"
              disabled={!transcript && !interimTranscript}
            >
              Clear
            </Button>

            <div className="flex-1" />

            <input
              type="file"
              accept={supportedFormats.join(',')}
              onChange={handleFileUpload}
              className="hidden"
              id="audio-upload"
            />
            <label
              htmlFor="audio-upload"
              className="px-3 py-2 text-sm border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
            >
              Upload Audio
            </label>
          </div>
        )}

        {/* Audio Quality Indicator */}
        {showQuality && audioQuality && (
          <div className="p-3 bg-gray-50 rounded-md">
            {getQualityIndicator()}
          </div>
        )}

        {/* Transcript Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Transcript</h4>
            {confidence > 0 && (
              <span className={`text-sm font-medium ${getConfidenceColor(confidence)}`}>
                {Math.round(confidence * 100)}% confidence
              </span>
            )}
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md min-h-[100px] max-h-[200px] overflow-y-auto">
            {transcript && (
              <p className="text-gray-800 mb-2">{transcript}</p>
            )}
            {interimTranscript && (
              <p className="text-gray-500 italic">{interimTranscript}</p>
            )}
            {!transcript && !interimTranscript && (
              <p className="text-gray-400 italic">No transcript yet...</p>
            )}
          </div>
        </div>

        {/* Statistics */}
        {showStats && (stats.totalDuration > 0 || stats.wordCount > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-md">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {Math.round(stats.totalDuration / 1000)}s
              </div>
              <div className="text-xs text-gray-600">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {stats.wordCount}
              </div>
              <div className="text-xs text-gray-600">Words</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {stats.segmentCount}
              </div>
              <div className="text-xs text-gray-600">Segments</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-800">
                {Math.round(stats.averageConfidence * 100)}%
              </div>
              <div className="text-xs text-gray-600">Confidence</div>
            </div>
          </div>
        )}

        {/* Processed Transcription */}
        {processedTranscription && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Processed Results</h4>
            <div className="p-3 bg-blue-50 rounded-md">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Full Text:</span>
                  <p className="font-medium text-gray-800 mt-1">
                    {processedTranscription.fullText}
                  </p>
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="text-gray-600">Word Count:</span>
                    <span className="ml-2 font-medium">{processedTranscription.wordCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-2 font-medium">
                      {Math.round(processedTranscription.duration / 1000)}s
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Confidence:</span>
                    <span className={`ml-2 font-medium ${getConfidenceColor(processedTranscription.confidence)}`}>
                      {Math.round(processedTranscription.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Segments */}
        {segments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Segments</h4>
            <div className="space-y-1 max-h-[150px] overflow-y-auto">
              {segments.map((segment, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-800">{segment.text}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {Math.round(segment.confidence * 100)}%
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {Math.round(segment.startTime / 1000)}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supported Formats */}
        <div className="text-xs text-gray-500">
          <div>Supported languages: {supportedLanguages.join(', ')}</div>
          <div>Supported formats: {supportedFormats.join(', ')}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BackendTranscriber