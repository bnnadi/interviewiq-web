import React, { useState, useEffect } from 'react'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { useBackendSpeechRecognition } from '../../hooks/useBackendSpeechRecognition'
import { useTimer } from '../../hooks/useTimer'
import { isClipboardSupported } from '../../utils/browserUtils'
import { getFinalTranscript, hasTranscript } from '../../utils/transcriptUtils'
import { createAccessibleButtonProps } from '../../utils/accessibilityUtils'
import { ProcessedTranscription } from '../../utils/transcriptionUtils'
import TranscriptDisplay from '../TranscriptDisplay'
import RecordingButton from '../RecordingButton'
import ControlButton from '../ControlButton'
import BackendTranscriber from './BackendTranscriber'
import AudioUploader from './AudioUploader'
import Button from '../shared/ui/Button'
import { Card } from '../ui/Card'
import ErrorMessage from '../shared/ui/ErrorMessage'
import LoadingSpinner from '../shared/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface EnhancedAnswerRecorderProps {
  question: string
  onTranscriptComplete: (transcript: string) => void
  onBack: () => void
  enableBackendTranscription?: boolean
  enableFileUpload?: boolean
  language?: string
  className?: string
}

type TranscriptionMode = 'browser' | 'backend' | 'upload'

const EnhancedAnswerRecorder: React.FC<EnhancedAnswerRecorderProps> = ({
  question,
  onTranscriptComplete,
  onBack,
  enableBackendTranscription = true,
  enableFileUpload = true,
  language = 'en-US',
  className = ''
}) => {
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>('browser')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Browser speech recognition
  const browserSpeech = useSpeechRecognition()
  
  // Backend speech recognition
  const backendSpeech = useBackendSpeechRecognition({
    language,
    enableRealTime: true,
    enableAnalysis: true,
    onTranscription: (transcription) => {
      setFinalTranscript(transcription.fullText)
    },
    onError: (err) => {
      setError(err.message)
      toast.error(`Backend transcription error: ${err.message}`)
    }
  })

  // Timer for recording duration
  const { time, formatTime, reset: resetTimer } = useTimer(
    transcriptionMode === 'browser' ? browserSpeech.isListening : backendSpeech.isListening
  )

  // Get current transcription state based on mode
  const getCurrentTranscription = () => {
    switch (transcriptionMode) {
      case 'browser':
        return {
          transcript: browserSpeech.transcript,
          interimTranscript: browserSpeech.interimTranscript,
          error: browserSpeech.error,
          isListening: browserSpeech.isListening,
          isPaused: browserSpeech.isPaused
        }
      case 'backend':
        return {
          transcript: backendSpeech.transcript,
          interimTranscript: backendSpeech.interimTranscript,
          error: backendSpeech.error,
          isListening: backendSpeech.isListening,
          isPaused: backendSpeech.isPaused
        }
      default:
        return {
          transcript: '',
          interimTranscript: '',
          error: null,
          isListening: false,
          isPaused: false
        }
    }
  }

  const currentTranscription = getCurrentTranscription()

  // Handle mode change
  const handleModeChange = (mode: TranscriptionMode) => {
    // Stop any active recording
    if (browserSpeech.isListening) {
      browserSpeech.stopListening()
    }
    if (backendSpeech.isListening) {
      backendSpeech.stopListening()
    }
    
    setTranscriptionMode(mode)
    setError(null)
    setFinalTranscript('')
    resetTimer()
  }

  // Handle start recording
  const handleStartRecording = () => {
    setError(null)
    setFinalTranscript('')
    resetTimer()

    if (transcriptionMode === 'browser') {
      browserSpeech.reset()
      browserSpeech.startListening()
    } else if (transcriptionMode === 'backend') {
      backendSpeech.reset()
      backendSpeech.startListening()
    }
  }

  // Handle stop recording
  const handleStopRecording = () => {
    if (transcriptionMode === 'browser') {
      browserSpeech.stopListening()
    } else if (transcriptionMode === 'backend') {
      backendSpeech.stopListening()
    }
  }

  // Handle pause/resume
  const handlePauseRecording = () => {
    if (transcriptionMode === 'browser') {
      browserSpeech.pauseListening()
    } else if (transcriptionMode === 'backend') {
      backendSpeech.pauseListening()
    }
  }

  const handleResumeRecording = () => {
    if (transcriptionMode === 'browser') {
      browserSpeech.resumeListening()
    } else if (transcriptionMode === 'backend') {
      backendSpeech.resumeListening()
    }
  }

  // Handle transcript completion
  const handleTranscriptComplete = (transcript: string) => {
    setFinalTranscript(transcript)
    onTranscriptComplete(transcript)
  }

  // Handle backend transcription completion
  const handleBackendTranscriptionComplete = (transcription: ProcessedTranscription) => {
    setFinalTranscript(transcription.fullText)
    onTranscriptComplete(transcription.fullText)
  }

  // Handle file upload completion
  const handleUploadComplete = (transcription: ProcessedTranscription) => {
    setFinalTranscript(transcription.fullText)
    onTranscriptComplete(transcription.fullText)
  }

  // Handle submit
  const handleSubmit = () => {
    const transcript = getFinalTranscript(currentTranscription.transcript, currentTranscription.interimTranscript)
    if (transcript) {
      handleTranscriptComplete(transcript)
    }
  }

  // Handle retry
  const handleRetry = () => {
    if (transcriptionMode === 'browser') {
      browserSpeech.reset()
    } else if (transcriptionMode === 'backend') {
      backendSpeech.reset()
    }
    setFinalTranscript('')
    setError(null)
    resetTimer()
  }

  // Copy to clipboard
  const copyToClipboard = () => {
    const transcript = getFinalTranscript(currentTranscription.transcript, currentTranscription.interimTranscript)
    if (transcript && isClipboardSupported()) {
      navigator.clipboard.writeText(transcript)
        .then(() => {
          toast.success('Transcript copied to clipboard')
        })
        .catch(() => {
          toast.error('Failed to copy transcript')
        })
    } else if (transcript) {
      toast.error('Clipboard not supported in this browser')
    }
  }

  // Check if we have a transcript
  const hasValidTranscript = hasTranscript(currentTranscription.transcript, currentTranscription.interimTranscript)

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Question Display */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 font-medium"
            {...createAccessibleButtonProps('Go back to questions list')}
          >
            ← Back to Questions
          </button>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Answer the Question
        </h1>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h2 className="text-sm font-medium text-blue-900 mb-2">Question:</h2>
          <p className="text-blue-800" aria-label={`Interview question: ${question}`}>
            {question}
          </p>
        </div>
      </Card>

      {/* Transcription Mode Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Transcription Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleModeChange('browser')}
            className={`p-4 text-left border rounded-lg transition-colors ${
              transcriptionMode === 'browser'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="font-medium text-sm">Browser Recognition</div>
            <div className="text-xs text-gray-500 mt-1">Fast, works offline, basic accuracy</div>
          </button>
          
          {enableBackendTranscription && (
            <button
              onClick={() => handleModeChange('backend')}
              className={`p-4 text-left border rounded-lg transition-colors ${
                transcriptionMode === 'backend'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium text-sm">Backend Recognition</div>
              <div className="text-xs text-gray-500 mt-1">High accuracy, real-time analysis</div>
            </button>
          )}
          
          {enableFileUpload && (
            <button
              onClick={() => handleModeChange('upload')}
              className={`p-4 text-left border rounded-lg transition-colors ${
                transcriptionMode === 'upload'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium text-sm">Upload Audio File</div>
              <div className="text-xs text-gray-500 mt-1">Upload pre-recorded audio</div>
            </button>
          )}
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <ErrorMessage 
          error={error}
          onDismiss={() => setError(null)}
          showNetworkStatus={true}
        />
      )}

      {/* Recording Interface */}
      {transcriptionMode === 'browser' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Browser Speech Recognition</h3>
          
          <div className="mb-6">
            <div className="flex justify-center items-center gap-4 mb-4" role="group" aria-label="Recording controls">
              <RecordingButton
                isListening={currentTranscription.isListening}
                onClick={currentTranscription.isListening ? handleStopRecording : handleStartRecording}
                disabled={!!currentTranscription.error}
                aria-label={currentTranscription.isListening ? 'Stop recording' : 'Start recording'}
              />

              {currentTranscription.isListening && (
                <ControlButton
                  onClick={currentTranscription.isPaused ? handleResumeRecording : handlePauseRecording}
                  variant={currentTranscription.isPaused ? "resume" : "pause"}
                  aria-label={currentTranscription.isPaused ? 'Resume recording' : 'Pause recording'}
                />
              )}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2" aria-live="polite">
                {currentTranscription.isListening ? 'Recording... Click to stop' :
                 currentTranscription.isPaused ? 'Paused... Click to resume' :
                 'Click the microphone to start recording'}
              </p>
              {currentTranscription.isListening && (
                <p className="text-lg font-mono text-blue-600" aria-live="polite" aria-label={`Recording time: ${formatTime(time)}`}>
                  {formatTime(time)}
                </p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="transcript-display" className="block text-sm font-medium text-gray-700">
                Your Answer:
              </label>
              <Button
                onClick={copyToClipboard}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
                disabled={!hasValidTranscript}
                {...createAccessibleButtonProps('Copy transcript to clipboard')}
              >
                Copy to Clipboard
              </Button>
            </div>
            <TranscriptDisplay
              transcript={currentTranscription.transcript}
              interimTranscript={currentTranscription.interimTranscript}
              id="transcript-display"
              aria-label="Your recorded answer transcript"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              onClick={handleRetry}
              variant="outline"
              {...createAccessibleButtonProps('Retry recording')}
            >
              Retry
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!hasValidTranscript}
              {...createAccessibleButtonProps('Submit answer for feedback')}
            >
              Submit Answer
            </Button>
          </div>
        </Card>
      )}

      {/* Backend Transcription Interface */}
      {transcriptionMode === 'backend' && enableBackendTranscription && (
        <BackendTranscriber
          onTranscriptionComplete={handleBackendTranscriptionComplete}
          onError={(err) => setError(err)}
          language={language}
          enableRealTime={true}
          enableAnalysis={true}
        />
      )}

      {/* File Upload Interface */}
      {transcriptionMode === 'upload' && enableFileUpload && (
        <AudioUploader
          onTranscriptionComplete={handleUploadComplete}
          onError={(err) => setError(err)}
          language={language}
          enableAnalysis={true}
        />
      )}
    </div>
  )
}

export default EnhancedAnswerRecorder
