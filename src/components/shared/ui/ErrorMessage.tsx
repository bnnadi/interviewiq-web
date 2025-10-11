import React from 'react'
import RetryButton from './RetryButton'
import { useNetworkStatus } from '@utils/networkUtils'

interface ErrorMessageProps {
  error: string | null
  onDismiss?: () => void
  onRetry?: () => void
  isRetrying?: boolean
  retryCount?: number
  maxRetries?: number
  showNetworkStatus?: boolean
  className?: string
}

function ErrorMessage({ 
  error, 
  onDismiss, 
  onRetry,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  showNetworkStatus = true,
  className = ''
}: ErrorMessageProps): JSX.Element | null {
  const networkStatus = useNetworkStatus()
  
  if (!error) return null

  const getErrorType = (errorMessage: string) => {
    if (errorMessage.includes('Network error') || errorMessage.includes('fetch')) {
      return 'network'
    }
    if (errorMessage.includes('HTTP 4')) {
      return 'client'
    }
    if (errorMessage.includes('HTTP 5')) {
      return 'server'
    }
    if (errorMessage.includes('timeout')) {
      return 'timeout'
    }
    return 'general'
  }

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case 'network':
        return (
          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
          </svg>
        )
      case 'timeout':
        return (
          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'server':
        return (
          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        )
      default:
        return (
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getErrorTitle = (errorType: string) => {
    switch (errorType) {
      case 'network':
        return 'Connection Error'
      case 'timeout':
        return 'Request Timeout'
      case 'server':
        return 'Server Error'
      case 'client':
        return 'Request Error'
      default:
        return 'Error'
    }
  }

  const getErrorSuggestion = (errorType: string) => {
    switch (errorType) {
      case 'network':
        return 'Please check your internet connection and try again.'
      case 'timeout':
        return 'The request is taking longer than expected. Please try again.'
      case 'server':
        return 'Our servers are experiencing issues. Please try again in a few moments.'
      case 'client':
        return 'There was an issue with your request. Please check your input and try again.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  const errorType = getErrorType(error)

  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 mb-6 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getErrorIcon(errorType)}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {getErrorTitle(errorType)}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            {error}
          </div>
          <div className="mt-1 text-xs text-red-600">
            {getErrorSuggestion(errorType)}
          </div>
          
          {/* Network Status Indicator */}
          {showNetworkStatus && (
            <div className="mt-2 flex items-center text-xs">
              <div className={`w-2 h-2 rounded-full mr-2 ${networkStatus.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={networkStatus.isOnline ? 'text-green-700' : 'text-red-700'}>
                {networkStatus.isOnline ? 'Online' : 'Offline'}
                {networkStatus.isSlowConnection && ' (Slow connection)'}
              </span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="mt-3 flex flex-wrap gap-2">
            {onRetry && (
              <RetryButton
                onRetry={onRetry}
                isRetrying={isRetrying}
                retryCount={retryCount}
                maxRetries={maxRetries}
                size="sm"
              />
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-sm text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-100 transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage