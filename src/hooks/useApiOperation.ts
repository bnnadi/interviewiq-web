import { useState, useCallback } from 'react'
import { logger } from '../utils/logger'
import { useRetry } from './useRetry'
import { useNetworkStatus } from '../utils/networkUtils'
import { ApiError } from '../services/apiService'

interface UseApiOperationReturn {
  loading: boolean
  error: string | null
  executeOperation: <T>(
    operation: () => Promise<T>,
    errorMessage: string,
    fallback?: () => void
  ) => Promise<T>
  retry: () => Promise<void>
  clearError: () => void
  setError: (error: string | null) => void
  isRetrying: boolean
  retryCount: number
  canRetry: boolean
  networkStatus: {
    isOnline: boolean
    isSlowConnection: boolean
  }
}

export const useApiOperation = (): UseApiOperationReturn => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [lastOperation, setLastOperation] = useState<{
    operation: () => Promise<any>
    errorMessage: string
    fallback?: () => void
  } | null>(null)
  
  const networkStatus = useNetworkStatus()
  const { isRetrying, retryCount, canRetry, executeWithRetry, resetRetry } = useRetry()

  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    errorMessage: string,
    fallback?: () => void
  ): Promise<T> => {
    setLoading(true)
    setError(null)
    resetRetry()
    
    // Store operation for potential retry
    setLastOperation({ operation, errorMessage, fallback })
    
    try {
      const result = await executeWithRetry(operation, errorMessage)
      return result
    } catch (err) {
      const apiError = err as ApiError
      
      // Use user-friendly message if available
      const errorMessage = apiError.userMessage || apiError.message || 'Unknown error'
      
      logger.error(errorMessage, err)
      setError(errorMessage)
      
      if (fallback) {
        fallback()
      }
      throw err
    } finally {
      setLoading(false)
    }
  }, [executeWithRetry, resetRetry])

  const retry = useCallback(async (): Promise<void> => {
    if (!lastOperation || !canRetry) {
      return
    }

    try {
      await executeOperation(
        lastOperation.operation,
        lastOperation.errorMessage,
        lastOperation.fallback
      )
    } catch (err) {
      // Error is already handled in executeOperation
      throw err
    }
  }, [lastOperation, canRetry, executeOperation])

  const clearError = useCallback(() => {
    setError(null)
    resetRetry()
  }, [resetRetry])

  return { 
    loading, 
    error, 
    executeOperation, 
    retry,
    clearError,
    setError,
    isRetrying,
    retryCount,
    canRetry,
    networkStatus
  }
}