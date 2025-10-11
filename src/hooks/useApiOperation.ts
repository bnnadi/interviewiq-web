import { useState, useCallback } from 'react'
import { logger } from '../utils/logger'

interface UseApiOperationReturn {
  loading: boolean
  error: string | null
  executeOperation: <T>(
    operation: () => Promise<T>,
    errorMessage: string,
    fallback?: () => void
  ) => Promise<T>
  clearError: () => void
  setError: (error: string | null) => void
}

export const useApiOperation = (): UseApiOperationReturn => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>,
    errorMessage: string,
    fallback?: () => void
  ): Promise<T> => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await operation()
      return result
    } catch (err) {
      logger.error(errorMessage, err)
      setError(`${errorMessage}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      
      if (fallback) {
        fallback()
      }
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { 
    loading, 
    error, 
    executeOperation, 
    clearError,
    setError 
  }
}
