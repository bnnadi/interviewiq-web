import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useTimer } from '../hooks/useTimer'
import { isClipboardSupported } from '../utils/browserUtils'
import { getFinalTranscript, hasTranscript } from '../utils/transcriptUtils'
import TranscriptDisplay from './TranscriptDisplay'
import RecordingButton from './RecordingButton'
import ControlButton from './ControlButton'
import Button from './shared/ui/Button'
import toast from 'react-hot-toast'

interface AnswerRecorderProps {
  question: string
  onTranscriptComplete: (transcript: string) => void
  onBack: () => void
}

function AnswerRecorder({ question, onTranscriptComplete, onBack }: AnswerRecorderProps) {
  const {
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
  } = useSpeechRecognition()

  const { time, formatTime, reset: resetTimer } = useTimer(isListening)

  const handleStartRecording = () => {
    reset()
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
    reset()
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            ← Back to Questions
          </button>
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Answer the Question
        </h2>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Question:</h3>
          <p className="text-blue-800">{question}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-center items-center gap-4 mb-4">
            <RecordingButton
              isListening={isListening}
              onClick={isListening ? handleStopRecording : handleStartRecording}
              disabled={!!error}
            />

            {isListening && (
              <ControlButton
                onClick={handlePauseRecording}
                variant="pause"
              />
            )}

            {isPaused && (
              <ControlButton
                onClick={handleResumeRecording}
                variant="resume"
              />
            )}
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              {isListening ? 'Recording... Click to stop' : 
               isPaused ? 'Paused... Click to resume' : 
               'Click the microphone to start recording'}
            </p>
            {isListening && (
              <p className="text-lg font-mono text-blue-600">
                {formatTime(time)}
              </p>
            )}
          </div>
        </div>

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