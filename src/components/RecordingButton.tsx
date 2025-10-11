import React from 'react'

const StopIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
  </svg>
)

const MicrophoneIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
  </svg>
)

interface RecordingButtonProps {
  isListening: boolean
  onClick: () => void
  disabled?: boolean
  className?: string
}

const RecordingButton = React.memo<RecordingButtonProps>(function RecordingButton({ 
  isListening, 
  onClick, 
  disabled = false,
  className = ""
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={isListening ? 'Stop recording' : 'Start recording'}
      aria-pressed={isListening}
      className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-medium transition-all focus:ring-2 focus:ring-offset-2 ${
        isListening 
          ? 'bg-red-500 hover:bg-red-600 animate-pulse focus:ring-red-500' 
          : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {isListening ? <StopIcon /> : <MicrophoneIcon />}
    </button>
  )
})

export default RecordingButton
