import React, { useState, useEffect } from 'react'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import LoadingSpinner from '@components/shared/ui/LoadingSpinner'
import ErrorMessage from '@components/shared/ui/ErrorMessage'
import { useDataSync } from '../../hooks/useDataSync'
import { useNetworkStatus } from '@utils/networkUtils'

interface DataSyncProps {
  onSyncComplete?: () => void
  onSyncError?: (error: string) => void
  className?: string
}

const DataSync: React.FC<DataSyncProps> = ({
  onSyncComplete,
  onSyncError,
  className = ''
}) => {
  const {
    lastSyncTime,
    syncStatus,
    syncProgress,
    syncError,
    syncData,
    enableAutoSync,
    disableAutoSync,
    isAutoSyncEnabled
  } = useDataSync()

  const networkStatus = useNetworkStatus()
  const [isManualSync, setIsManualSync] = useState(false)

  // Handle sync completion
  useEffect(() => {
    if (syncStatus === 'completed' && !syncError) {
      onSyncComplete?.()
      setIsManualSync(false)
    }
  }, [syncStatus, syncError, onSyncComplete])

  // Handle sync errors
  useEffect(() => {
    if (syncError) {
      onSyncError?.(syncError)
      setIsManualSync(false)
    }
  }, [syncError, onSyncError])

  const handleManualSync = async () => {
    setIsManualSync(true)
    try {
      await syncData()
    } catch (error) {
      console.error('Manual sync failed:', error)
    }
  }

  const handleToggleAutoSync = () => {
    if (isAutoSyncEnabled) {
      disableAutoSync()
    } else {
      enableAutoSync()
    }
  }

  const formatLastSync = (timestamp: Date | null) => {
    if (!timestamp) return 'Never'
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return timestamp.toLocaleDateString()
  }

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'syncing': return 'text-blue-600'
      case 'completed': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'offline': return 'text-gray-500'
      default: return 'text-gray-600'
    }
  }

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'syncing': return 'Syncing...'
      case 'completed': return 'Up to date'
      case 'error': return 'Sync failed'
      case 'offline': return 'Offline'
      default: return 'Ready to sync'
    }
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Data Synchronization</h3>
        <div className="flex items-center space-x-2">
          <div className={`text-sm font-medium ${getSyncStatusColor()}`}>
            {getSyncStatusText()}
          </div>
          {syncStatus === 'syncing' && (
            <LoadingSpinner />
          )}
        </div>
      </div>

      {/* Network Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              networkStatus.isOnline ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-600">
              {networkStatus.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Last sync: {formatLastSync(lastSyncTime)}
          </div>
        </div>
      </div>

      {/* Sync Progress */}
      {syncStatus === 'syncing' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Syncing data...</span>
            <span>{syncProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {syncError && (
        <div className="mb-4">
          <ErrorMessage 
            error={syncError}
            onDismiss={() => {}}
            showNetworkStatus={false}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleManualSync}
          disabled={!networkStatus.isOnline || syncStatus === 'syncing' || isManualSync}
          className="flex-1"
        >
          {isManualSync ? (
            <>
              <LoadingSpinner />
              <span className="ml-2">Syncing...</span>
            </>
          ) : (
            'Sync Now'
          )}
        </Button>
        
        <Button
          onClick={handleToggleAutoSync}
          variant={isAutoSyncEnabled ? "outline" : "outline"}
          className={`flex-1 ${
            isAutoSyncEnabled 
              ? 'text-green-600 border-green-600 hover:bg-green-50' 
              : 'text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {isAutoSyncEnabled ? 'Disable Auto-Sync' : 'Enable Auto-Sync'}
        </Button>
      </div>

      {/* Auto-sync Info */}
      {isAutoSyncEnabled && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-sm text-blue-800">
              Auto-sync enabled - Data will sync automatically when online
            </span>
          </div>
        </div>
      )}

      {/* Offline Notice */}
      {!networkStatus.isOnline && (
        <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-sm text-yellow-800">
              You're offline - Data will sync when connection is restored
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}

export default DataSync
