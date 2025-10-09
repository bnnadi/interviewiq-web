import React from 'react'

interface TranscriptDisplayProps {
  transcript: string
  interimTranscript: string
}

const TranscriptDisplay = React.memo<TranscriptDisplayProps>(function TranscriptDisplay({ 
  transcript, 
  interimTranscript 
}) {
  if (!transcript && !interimTranscript) {
    return (
      <p className="text-gray-400 italic">
        Your speech will appear here as you speak...
      </p>
    )
  }

  return (
    <>
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
    </>
  )
})

export default TranscriptDisplay
