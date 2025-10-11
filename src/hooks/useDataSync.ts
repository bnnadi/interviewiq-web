import { useState, useEffect, useCallback, useRef } from 'react'
import { useNetworkStatus } from '@utils/networkUtils'
import { dataService } from '../services/dataService'
import { logger } from '@utils/logger'
import { SessionSummary } from '@types/session'

export type SyncStatus = 'idle' | 'syncing' | 'completed' | 'error' | 'offline'

interface UseDataSyncOptions {
  autoSyncInterval?: number // in milliseconds
  enableAutoSync?: boolean
  onSyncStart?: () => void
  onSyncComplete?: () => void
  onSyncError?: (error: string) => void
}

interface UseDataSyncReturn {
  // Status
  syncStatus: SyncStatus
  isOnline: boolean
  lastSyncTime: Date | null
  syncProgress: number
  syncError: string | null
  
  // Auto-sync control
  isAutoSyncEnabled: boolean
  enableAutoSync: () => void
  disableAutoSync: () => void
  
  // Manual sync
  syncData: () => Promise<void>
  clearSyncError: () => void
  
  // Sync statistics
  syncStats: {
    totalSyncs: number
    successfulSyncs: number
    failedSyncs: number
    lastSyncDuration: number | null
  }
}

export const useDataSync = (options: UseDataSyncOptions = {}): UseDataSyncReturn => {
  const {
    autoSyncInterval = 300000, // 5 minutes
    enableAutoSync: initialAutoSync = false,
    onSyncStart,
    onSyncComplete,
    onSyncError
  } = options

  const networkStatus = useNetworkStatus()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncProgress, setSyncProgress] = useState(0)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(initialAutoSync)
  
  const [syncStats, setSyncStats] = useState({
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    lastSyncDuration: null as number | null
  })

  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null)
  const syncStartTimeRef = useRef<number | null>(null)

  // Update sync status based on network status
  useEffect(() => {
    if (!networkStatus.isOnline && syncStatus !== 'syncing') {
      setSyncStatus('offline')
    } else if (networkStatus.isOnline && syncStatus === 'offline') {
      setSyncStatus('idle')
    }
  }, [networkStatus.isOnline, syncStatus])

  // Auto-sync functionality
  useEffect(() => {
    if (isAutoSyncEnabled && networkStatus.isOnline && syncStatus === 'idle') {
      autoSyncTimerRef.current = setTimeout(() => {
        syncData()
      }, autoSyncInterval)
    }

    return () => {
      if (autoSyncTimerRef.current) {
        clearTimeout(autoSyncTimerRef.current)
      }
    }
  }, [isAutoSyncEnabled, networkStatus.isOnline, syncStatus, autoSyncInterval])

  const syncData = useCallback(async (): Promise<void> => {
    if (!networkStatus.isOnline) {
      setSyncStatus('offline')
      setSyncError('No internet connection available')
      return
    }

    if (syncStatus === 'syncing') {
      logger.warn('Sync already in progress, skipping')
      return
    }

    setSyncStatus('syncing')
    setSyncError(null)
    setSyncProgress(0)
    syncStartTimeRef.current = Date.now()
    
    onSyncStart?.()

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 200)

      // Perform actual sync operations
      await dataService.syncUserData()
      await dataService.syncSessionData()
      
      clearInterval(progressInterval)
      setSyncProgress(100)

      // Update sync statistics
      const syncDuration = syncStartTimeRef.current ? Date.now() - syncStartTimeRef.current : null
      setSyncStats(prev => ({
        ...prev,
        totalSyncs: prev.totalSyncs + 1,
        successfulSyncs: prev.successfulSyncs + 1,
        lastSyncDuration: syncDuration
      }))

      setLastSyncTime(new Date())
      setSyncStatus('completed')
      
      logger.info('Data sync completed successfully')
      onSyncComplete?.()

      // Reset to idle after a short delay
      setTimeout(() => {
        setSyncStatus('idle')
        setSyncProgress(0)
      }, 2000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed'
      setSyncError(errorMessage)
      setSyncStatus('error')
      
      // Update sync statistics
      setSyncStats(prev => ({
        ...prev,
        totalSyncs: prev.totalSyncs + 1,
        failedSyncs: prev.failedSyncs + 1
      }))

      logger.error('Data sync failed:', error)
      onSyncError?.(errorMessage)

      // Reset to idle after error display
      setTimeout(() => {
        setSyncStatus('idle')
        setSyncProgress(0)
      }, 5000)
    }
  }, [networkStatus.isOnline, syncStatus, onSyncStart, onSyncComplete, onSyncError])

  const enableAutoSync = useCallback(() => {
    setIsAutoSyncEnabled(true)
    logger.info('Auto-sync enabled')
  }, [])

  const disableAutoSync = useCallback(() => {
    setIsAutoSyncEnabled(false)
    if (autoSyncTimerRef.current) {
      clearTimeout(autoSyncTimerRef.current)
    }
    logger.info('Auto-sync disabled')
  }, [])

  const clearSyncError = useCallback(() => {
    setSyncError(null)
    if (syncStatus === 'error') {
      setSyncStatus('idle')
    }
  }, [syncStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSyncTimerRef.current) {
        clearTimeout(autoSyncTimerRef.current)
      }
    }
  }, [])

  return {
    syncStatus,
    isOnline: networkStatus.isOnline,
    lastSyncTime,
    syncProgress,
    syncError,
    isAutoSyncEnabled,
    enableAutoSync,
    disableAutoSync,
    syncData,
    clearSyncError,
    syncStats
  }
}
