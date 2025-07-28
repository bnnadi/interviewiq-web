import React, { useState, useEffect, useRef } from 'react'

function AnswerRecorder({ question, onTranscriptComplete, onBack }) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

  useEffect(() => {
    // Check if SpeechRecognition is supported
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      return
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    
    const recognition = recognitionRef.current
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsRecording(true)
      setError('')
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setTranscript(prev => prev + finalTranscript)
      setInterimTranscript(interimTranscript)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setError(`Speech recognition error: ${event.error}`)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startRecording = () => {
    if (recognitionRef.current) {
      setTranscript('')
      setInterimTranscript('')
      setError('')
      recognitionRef.current.start()
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const handleSubmit = () => {
    const finalTranscript = transcript + interimTranscript
    if (finalTranscript.trim()) {
      onTranscriptComplete(finalTranscript.trim())
    }
  }

  const handleRetry = () => {
    setTranscript('')
    setInterimTranscript('')
    setError('')
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
          <div className="flex justify-center mb-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!!error}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-medium transition-all ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } ${error ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isRecording ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          
          <p className="text-center text-sm text-gray-600">
            {isRecording ? 'Recording... Click to stop' : 'Click the microphone to start recording'}
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Answer:
          </label>
          <div className="border border-gray-300 rounded-lg p-4 min-h-[200px] bg-gray-50">
            {transcript && (
              <div className="mb-2">
                <span className="text-gray-900">{transcript}</span>
              </div>
            )}
            {interimTranscript && (
              <div>
                <span className="text-gray-500 italic">{interimTranscript}</span>
              </div>
            )}
            {!transcript && !interimTranscript && (
              <p className="text-gray-400 italic">
                Your speech will appear here as you speak...
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleRetry}
            disabled={!transcript && !interimTranscript}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Retry
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!transcript.trim() && !interimTranscript.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Submit Answer
          </button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-md">
          <h3 className="text-sm font-medium text-yellow-900 mb-2">🎤 Recording Tips</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Speak clearly and at a normal pace</li>
            <li>• Use the STAR method for behavioral questions</li>
            <li>• Include specific examples and outcomes</li>
            <li>• Take your time - you can pause and continue</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AnswerRecorder 