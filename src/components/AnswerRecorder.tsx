import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useBackendSpeechRecognition } from '../hooks/useBackendSpeechRecognition'
import { useTimer } from '../hooks/useTimer'
import { isClipboardSupported } from '../utils/browserUtils'
import { getFinalTranscript, hasTranscript } from '../utils/transcriptUtils'
// useAccessibility import removed as it's not used in this component
import { createAccessibleButtonProps } from '../utils/accessibilityUtils'
import TranscriptDisplay from './TranscriptDisplay'
import RecordingButton from './RecordingButton'
import ControlButton from './ControlButton'
import Button from './shared/ui/Button'
import BackendTranscriber from './recording/BackendTranscriber'
import AudioUploader from './recording/AudioUploader'
import toast from 'react-hot-toast'
import { useState } from 'react'

interface AnswerRecorderProps {
  question: string
  onTranscriptComplete: (transcript: string) => void
  onBack: () => void
  useBackendTranscription?: boolean
  enableFileUpload?: boolean
}

function AnswerRecorder({ 
  question, 
  onTranscriptComplete, 
  onBack, 
  useBackendTranscription = false,
  enableFileUpload = false 
}: AnswerRecorderProps) {
  const [transcriptionMode, setTranscriptionMode] = useState<'browser' | 'backend' | 'upload'>('browser')
  
  // Browser speech recognition
  const browserSpeech = useSpeechRecognition()
  
  // Backend speech recognition
  const backendSpeech = useBackendSpeechRecognition({
    language: 'en-US',
    enableRealTime: true,
    onTranscription: (result) => {
      if (result.isFinal) {
        onTranscriptComplete(result.transcript)
      }
    },
    onError: (error) => {
      toast.error(`Backend transcription error: ${error.message}`)
    }
  })

  // Use the appropriate speech recognition based on mode
  const speechRecognition = useBackendTranscription && transcriptionMode === 'backend' 
    ? backendSpeech 
    : browserSpeech

  const {
    isListening,
    isPaused,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    pauseListening,
    resumeListening
  } = speechRecognition

  // Get reset method safely
  const reset = 'reset' in speechRecognition && typeof speechRecognition.reset === 'function' 
    ? speechRecognition.reset 
    : () => {}

  // Handle reset for backend speech recognition
  const handleReset = () => {
    if (useBackendTranscription && transcriptionMode === 'backend') {
      // Backend speech recognition doesn't have reset method
      // We'll clear the transcript by calling the backend reset if available
      if ('reset' in backendSpeech && typeof backendSpeech.reset === 'function') {
        backendSpeech.reset()
      }
    } else {
      reset()
    }
  }
  
  // Accessibility features are handled by the components themselves

  const { time, formatTime, reset: resetTimer } = useTimer(isListening)

  const handleStartRecording = () => {
    handleReset()
    startListening()
  }

  const handleStopRecording = () => {
    stopListening()
  }

  const handlePauseRecording = () => {
    pauseListening()
  }

  const handleResumeRecording = () => {
    resumeListening()
  }

  const handleSubmit = () => {
    const finalTranscript = getFinalTranscript(transcript, interimTranscript)
    if (finalTranscript) {
      onTranscriptComplete(finalTranscript)
    }
  }

  const handleRetry = () => {
    handleReset()
    resetTimer()
  }

  const copyToClipboard = () => {
    const finalTranscript = getFinalTranscript(transcript, interimTranscript)
    if (finalTranscript && isClipboardSupported()) {
      navigator.clipboard.writeText(finalTranscript)
        .then(() => {
          toast.success('Transcript copied to clipboard')
        })
        .catch(() => {
          toast.error('Failed to copy transcript')
        })
    } else if (finalTranscript) {
      toast.error('Clipboard not supported in this browser')
    }
  }

  const handleBackendTranscriptionComplete = (result: any) => {
    onTranscriptComplete(result.transcript)
  }

  const handleFileUploadComplete = (result: any) => {
    onTranscriptComplete(result.transcript)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
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

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-sm font-medium text-blue-900 mb-2">Question:</h2>
          <p className="text-blue-800" aria-label={`Interview question: ${question}`}>
            {question}
          </p>
        </div>

        {/* Transcription Mode Selector */}
        {(useBackendTranscription || enableFileUpload) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Recording Method:</h3>
            <div className="flex space-x-4">
              <button
                onClick={() => setTranscriptionMode('browser')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  transcriptionMode === 'browser'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Browser Recording
              </button>
              {useBackendTranscription && (
                <button
                  onClick={() => setTranscriptionMode('backend')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    transcriptionMode === 'backend'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Backend Transcription
                </button>
              )}
              {enableFileUpload && (
                <button
                  onClick={() => setTranscriptionMode('upload')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    transcriptionMode === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Upload Audio File
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Recording Controls - Conditional based on mode */}
        {transcriptionMode === 'browser' && (
          <div className="mb-6">
            <div className="flex justify-center items-center gap-4 mb-4" role="group" aria-label="Recording controls">
              <RecordingButton
                isListening={isListening}
                onClick={isListening ? handleStopRecording : handleStartRecording}
                disabled={!!error}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
              />

              {isListening && (
                <ControlButton
                  onClick={handlePauseRecording}
                  variant="pause"
                  aria-label="Pause recording"
                />
              )}

              {isPaused && (
                <ControlButton
                  onClick={handleResumeRecording}
                  variant="resume"
                  aria-label="Resume recording"
                />
              )}
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2" aria-live="polite">
                {isListening ? 'Recording... Click to stop' : 
                 isPaused ? 'Paused... Click to resume' : 
                 'Click the microphone to start recording'}
              </p>
              {isListening && (
                <p className="text-lg font-mono text-blue-600" aria-live="polite" aria-label={`Recording time: ${formatTime(time)}`}>
                  {formatTime(time)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Backend Transcription Component */}
        {transcriptionMode === 'backend' && (
          <div className="mb-6">
            <BackendTranscriber
              language="en-US"
              enableRealTime={true}
              onTranscriptionComplete={handleBackendTranscriptionComplete}
              onError={(error) => {
                toast.error(`Backend transcription error: ${error.message}`)
              }}
              showControls={true}
              showStats={true}
              showQuality={true}
            />
          </div>
        )}

        {/* Audio File Upload Component */}
        {transcriptionMode === 'upload' && (
          <div className="mb-6">
            <AudioUploader
              onTranscriptionComplete={handleFileUploadComplete}
              onError={(error) => {
                toast.error(`File upload error: ${error.message}`)
              }}
              maxFileSize={50}
              language="en-US"
              showPreview={true}
              showProgress={true}
              multiple={false}
            />
          </div>
        )}

        {/* Transcript Display - Show for browser mode or when we have transcript from other modes */}
        {(transcriptionMode === 'browser' || transcript || interimTranscript) && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Your Answer:
              </label>
              {hasTranscript(transcript, interimTranscript) && (
                <button
                  onClick={copyToClipboard}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Copy to clipboard
                </button>
              )}
            </div>
            <div className="border border-gray-300 rounded-lg p-4 min-h-[200px] bg-gray-50">
              <TranscriptDisplay 
                transcript={transcript} 
                interimTranscript={interimTranscript} 
              />
            </div>
          </div>
        )}

        {/* Action Buttons - Show for browser mode or when we have transcript */}
        {(transcriptionMode === 'browser' || transcript || interimTranscript) && (
          <div className="flex justify-between">
            <Button
              onClick={handleRetry}
              disabled={!hasTranscript(transcript, interimTranscript)}
              variant="outline"
            >
              Retry
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!getFinalTranscript(transcript, interimTranscript)}
              variant="primary"
            >
              Submit Answer
            </Button>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 rounded-md">
          <h3 className="text-sm font-medium text-yellow-900 mb-2">🎤 Recording Tips</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Speak clearly and at a normal pace</li>
            <li>• Use the STAR method for behavioral questions</li>
            <li>• Include specific examples and outcomes</li>
            <li>• Take your time - you can pause and continue</li>
            <li>• Ensure your microphone is working and accessible</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AnswerRecorder 