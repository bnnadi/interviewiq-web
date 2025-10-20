import { useState, useCallback } from 'react'
import { logger } from '../utils/logger'

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryCondition?: (error: Error) => boolean
}

export interface RetryState {
  isRetrying: boolean
  retryCount: number
  lastError: Error | null
  canRetry: boolean
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryCondition: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.name === 'TypeError' ||
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.message.includes('Network error') ||
      error.message.includes('HTTP 5')
    )
  }
}

export const useRetry = (config: Partial<RetryConfig> = {}) => {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    canRetry: true
  })

  const calculateDelay = useCallback((attempt: number): number => {
    const delay = retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt)
    return Math.min(delay, retryConfig.maxDelay)
  }, [retryConfig])

  const sleep = useCallback((ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }, [])

  // Extract retry delay handling
  const handleRetryDelay = useCallback(async (attempt: number, operationName: string) => {
    setRetryState(prev => ({ ...prev, isRetrying: true, retryCount: attempt }))
    
    const delay = calculateDelay(attempt - 1)
    logger.info(`Retrying ${operationName} in ${delay}ms (attempt ${attempt}/${retryConfig.maxRetries})`)
    await sleep(delay)
  }, [calculateDelay, sleep, retryConfig.maxRetries])

  // Extract success state reset
  const resetRetryState = useCallback(() => {
    setRetryState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      canRetry: true
    })
  }, [])

  // Extract error handling logic
  const handleRetryError = useCallback((error: Error, attempt: number, maxRetries: number, operationName: string): boolean => {
    const shouldRetry = retryConfig.retryCondition?.(error) ?? true
    const isLastAttempt = attempt >= maxRetries
    
    if (!shouldRetry || isLastAttempt) {
      setRetryState({
        isRetrying: false,
        retryCount: attempt,
        lastError: error,
        canRetry: false
      })
      
      if (isLastAttempt) {
        logger.error(`Max retries exceeded for ${operationName}`, error)
      } else {
        logger.error(`Non-retryable error for ${operationName}`, error)
      }
      
      return false // Don't retry
    }
    
    logger.warn(`Attempt ${attempt + 1} failed for ${operationName}, will retry`, error)
    return true // Should retry
  }, [retryConfig.retryCondition])

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> => {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await handleRetryDelay(attempt, operationName)
        }

        const result = await operation()
        resetRetryState()
        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        const shouldRetry = handleRetryError(lastError, attempt, retryConfig.maxRetries, operationName)
        if (!shouldRetry) {
          throw lastError
        }
      }
    }
    
    throw lastError || new Error('Retry failed')
  }, [retryConfig.maxRetries, handleRetryDelay, resetRetryState, handleRetryError])

  const resetRetry = useCallback(() => {
    resetRetryState()
  }, [resetRetryState])

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> => {
    return executeWithRetry(operation, operationName)
  }, [executeWithRetry])

  return {
    ...retryState,
    executeWithRetry,
    retry,
    resetRetry
  }
}
