import React from 'react'
import { Card } from '@components/ui/Card'
import DataSync from '@components/data/DataSync'
import DataExport from '@components/data/DataExport'
import { useUserData } from '@hooks/useUserData'
import { useDataSync } from '@hooks/useDataSync'
import LoadingSpinner from '@components/shared/ui/LoadingSpinner'
import ErrorMessage from '@components/shared/ui/ErrorMessage'

const DataManagement: React.FC = () => {
  const { userData, sessionHistory, isLoading, error, refreshData, dataStats } = useUserData()
  const { syncStatus, lastSyncTime, syncStats } = useDataSync()

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner message="Loading data management..." />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Data Management
        </h1>
        <p className="text-gray-600">
          Manage your data, sync with the cloud, and export your information
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <ErrorMessage 
          error={error}
          onDismiss={() => {}}
          showNetworkStatus={true}
        />
      )}

      {/* Data Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {dataStats.totalSessions}
            </div>
            <div className="text-sm text-blue-800">Total Sessions</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {dataStats.dataSize > 0 ? `${Math.round(dataStats.dataSize / 1024)} KB` : '0 KB'}
            </div>
            <div className="text-sm text-green-800">Data Size</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {dataStats.lastUpdated ? 
                new Date(dataStats.lastUpdated).toLocaleDateString() : 
                'Never'
              }
            </div>
            <div className="text-sm text-purple-800">Last Updated</div>
          </div>
        </div>
      </Card>

      {/* Sync Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Synchronization Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Sync Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                syncStatus === 'completed' ? 'bg-green-100 text-green-800' :
                syncStatus === 'syncing' ? 'bg-blue-100 text-blue-800' :
                syncStatus === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {syncStatus}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Last sync: {lastSyncTime ? lastSyncTime.toLocaleString() : 'Never'}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">Sync Statistics</div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Total syncs: {syncStats.totalSyncs}</div>
              <div>Successful: {syncStats.successfulSyncs}</div>
              <div>Failed: {syncStats.failedSyncs}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Data Management Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Synchronization */}
        <DataSync 
          onSyncComplete={() => {
            console.log('Sync completed successfully')
            refreshData()
          }}
          onSyncError={(error) => {
            console.error('Sync failed:', error)
          }}
        />

        {/* Data Export */}
        <DataExport 
          onExportComplete={(filename) => {
            console.log('Export completed:', filename)
          }}
          onExportError={(error) => {
            console.error('Export failed:', error)
          }}
        />
      </div>

      {/* Data Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Information</h2>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">What data is stored?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your user profile and preferences</li>
              <li>• Interview session history and transcripts</li>
              <li>• Practice questions and feedback</li>
              <li>• Analytics and progress data</li>
            </ul>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Data synchronization</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Data syncs automatically when online</li>
              <li>• Works offline with local storage</li>
              <li>• Secure encryption for sensitive data</li>
              <li>• You can export your data anytime</li>
            </ul>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">Privacy & Security</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Your data is encrypted and secure</li>
              <li>• We don't share your personal information</li>
              <li>• You can delete your data anytime</li>
              <li>• GDPR compliant data handling</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default DataManagement
