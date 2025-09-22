import { useState, useCallback } from 'react'
import { logger } from '../utils/logger.js'

export const useApiOperation = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const executeOperation = useCallback(async (operation, errorMessage, fallback) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await operation()
      return result
    } catch (err) {
      logger.error(errorMessage, err)
      setError(`${errorMessage}: ${err.message}`)
      
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
