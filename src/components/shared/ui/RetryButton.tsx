import React from 'react'
import Button from './Button'

interface RetryButtonProps {
  onRetry: () => void
  isRetrying?: boolean
  retryCount?: number
  maxRetries?: number
  disabled?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

const RetryButton: React.FC<RetryButtonProps> = ({
  onRetry,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  disabled = false,
  className = '',
  variant = 'outline',
  size = 'md'
}) => {
  const getButtonText = () => {
    if (isRetrying) {
      return `Retrying... (${retryCount}/${maxRetries})`
    }
    
    if (retryCount > 0) {
      return `Try Again (${retryCount}/${maxRetries})`
    }
    
    return 'Try Again'
  }

  const getButtonIcon = () => {
    if (isRetrying) {
      return (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )
    }
    
    return (
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    )
  }

  return (
    <Button
      onClick={onRetry}
      disabled={disabled || isRetrying}
      variant={variant}
      size={size}
      className={`flex items-center ${className}`}
    >
      {getButtonIcon()}
      {getButtonText()}
    </Button>
  )
}

export default RetryButton
