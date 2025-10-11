import React from 'react'

const PauseIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
)

const PlayIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
)

interface ControlButtonProps {
  onClick: () => void
  variant: 'pause' | 'resume'
  className?: string
}

const ControlButton = React.memo<ControlButtonProps>(function ControlButton({ 
  onClick, 
  variant, 
  className = "" 
}) {
  const variantClasses = {
    pause: 'bg-yellow-500 hover:bg-yellow-600',
    resume: 'bg-green-500 hover:bg-green-600'
  }

  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${variantClasses[variant]} ${className}`}
      aria-label={variant === 'pause' ? 'Pause recording' : 'Resume recording'}
    >
      {variant === 'pause' ? <PauseIcon /> : <PlayIcon />}
    </button>
  )
})

export default ControlButton
