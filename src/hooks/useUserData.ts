import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@context/AuthContext'
import { dataService } from '../services/dataService'
import { sessionStorage } from '@services/sessionPersistence'
import { logger } from '@utils/logger'
import { SessionSummary } from '@types/session'

interface UserData {
  id: string
  email: string
  name: string
  role: 'user' | 'enterprise'
  createdAt: Date
  lastLoginAt: Date
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    notifications: boolean
    autoSave: boolean
    language: string
  }
  statistics: {
    totalSessions: number
    averageScore: number
    improvementRate: number
    currentStreak: number
    lastActivity: Date
  }
}

interface UseUserDataOptions {
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
  onDataUpdate?: (data: UserData) => void
  onError?: (error: string) => void
}

interface UseUserDataReturn {
  // Data
  userData: UserData | null
  sessionHistory: SessionSummary[]
  isLoading: boolean
  error: string | null
  
  // Actions
  refreshData: () => Promise<void>
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  clearError: () => void
  
  // Statistics
  dataStats: {
    lastUpdated: Date | null
    totalSessions: number
    dataSize: number // in bytes
    cacheStatus: 'fresh' | 'stale' | 'error'
  }
}

export const useUserData = (options: UseUserDataOptions = {}): UseUserDataReturn => {
  const {
    autoRefresh = true,
    refreshInterval = 300000, // 5 minutes
    onDataUpdate,
    onError
  } = options

  const { user } = useAuth()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [sessionHistory, setSessionHistory] = useState<SessionSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataStats, setDataStats] = useState({
    lastUpdated: null as Date | null,
    totalSessions: 0,
    dataSize: 0,
    cacheStatus: 'fresh' as 'fresh' | 'stale' | 'error'
  })

  // Load user data and session history
  const loadData = useCallback(async () => {
    if (!user) {
      setUserData(null)
      setSessionHistory([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Load user data from backend
      const userDataFromBackend = await dataService.getUserData(user.id)
      
      // Load session history from local storage
      const sessions = await sessionStorage.getAllSessions()
      
      // Calculate statistics
      const completedSessions = sessions.filter(s => s.status === 'completed')
      const totalSessions = completedSessions.length
      
      // Calculate data size (approximate)
      const dataSize = JSON.stringify({ userDataFromBackend, sessions }).length
      
      // Update state
      setUserData(userDataFromBackend)
      setSessionHistory(sessions)
      setDataStats(prev => ({
        ...prev,
        lastUpdated: new Date(),
        totalSessions,
        dataSize,
        cacheStatus: 'fresh'
      }))

      onDataUpdate?.(userDataFromBackend)
      logger.info('User data loaded successfully')

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user data'
      setError(errorMessage)
      setDataStats(prev => ({ ...prev, cacheStatus: 'error' }))
      onError?.(errorMessage)
      logger.error('Failed to load user data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user, onDataUpdate, onError])

  // Update user data
  const updateUserData = useCallback(async (updates: Partial<UserData>) => {
    if (!userData) return

    try {
      const updatedData = { ...userData, ...updates }
      await dataService.updateUserData(user.id, updates)
      setUserData(updatedData)
      
      // Update data size
      const dataSize = JSON.stringify({ userData: updatedData, sessionHistory }).length
      setDataStats(prev => ({
        ...prev,
        dataSize,
        lastUpdated: new Date()
      }))

      logger.info('User data updated successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user data'
      setError(errorMessage)
      onError?.(errorMessage)
      logger.error('Failed to update user data:', err)
    }
  }, [userData, user, sessionHistory, onError])

  // Refresh data
  const refreshData = useCallback(async () => {
    await loadData()
  }, [loadData])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
    setDataStats(prev => ({ ...prev, cacheStatus: 'fresh' }))
  }, [])

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && user) {
      const interval = setInterval(() => {
        setDataStats(prev => ({ ...prev, cacheStatus: 'stale' }))
        loadData()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, user, refreshInterval, loadData])

  // Initial data load
  useEffect(() => {
    loadData()
  }, [loadData])

  // Update statistics when session history changes
  useEffect(() => {
    if (sessionHistory.length > 0) {
      const completedSessions = sessionHistory.filter(s => s.status === 'completed')
      setDataStats(prev => ({
        ...prev,
        totalSessions: completedSessions.length
      }))
    }
  }, [sessionHistory])

  return {
    userData,
    sessionHistory,
    isLoading,
    error,
    refreshData,
    updateUserData,
    clearError,
    dataStats
  }
}
