import React, { useState, useEffect, useRef } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useTimer } from '../hooks/useTimer.js'
import { isClipboardSupported } from '../utils/browserUtils.js'
import { getFinalTranscript, hasTranscript } from '../utils/transcriptUtils.js'
import TranscriptDisplay from './TranscriptDisplay.jsx'
import Button from './ui/Button.jsx'
import toast from 'react-hot-toast'

function AnswerRecorder({ question, onTranscriptComplete, onBack }) {
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

  const startRecording = () => {
    reset()
    startListening()
  }

  const stopRecording = () => {
    stopListening()
  }

  const pauseRecording = () => {
    pauseListening()
  }

  const resumeRecording = () => {
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
            <button
              onClick={isListening ? stopRecording : startRecording}
              disabled={!!error}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-medium transition-all ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } ${error ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isListening ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {isListening && (
              <button
                onClick={pauseRecording}
                className="w-12 h-12 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center text-white"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}

            {isPaused && (
              <button
                onClick={resumeRecording}
                className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </button>
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