import React, { useState } from 'react'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import LoadingSpinner from '@components/shared/ui/LoadingSpinner'
import ErrorMessage from '@components/shared/ui/ErrorMessage'
import { useUserData } from '../../hooks/useUserData'

interface DataExportProps {
  onExportComplete?: (filename: string) => void
  onExportError?: (error: string) => void
  className?: string
}

type ExportFormat = 'json' | 'csv' | 'pdf'
type ExportType = 'sessions' | 'profile' | 'all'

const DataExport: React.FC<DataExportProps> = ({
  onExportComplete,
  onExportError,
  className = ''
}) => {
  const { userData, sessionHistory, isLoading } = useUserData()
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json')
  const [selectedType, setSelectedType] = useState<ExportType>('all')

  const handleExport = async () => {
    if (!userData) {
      setExportError('No user data available to export')
      return
    }

    setIsExporting(true)
    setExportError(null)

    try {
      let data: any
      let filename: string
      let mimeType: string

      switch (selectedType) {
        case 'sessions':
          data = sessionHistory
          filename = `confida-sessions-${new Date().toISOString().split('T')[0]}`
          break
        case 'profile':
          data = userData
          filename = `confida-profile-${new Date().toISOString().split('T')[0]}`
          break
        case 'all':
          data = {
            user: userData,
            sessions: sessionHistory,
            exportDate: new Date().toISOString(),
            version: '1.0'
          }
          filename = `confida-data-${new Date().toISOString().split('T')[0]}`
          break
        default:
          throw new Error('Invalid export type')
      }

      // Format data based on selected format
      switch (selectedFormat) {
        case 'json':
          mimeType = 'application/json'
          filename += '.json'
          break
        case 'csv':
          mimeType = 'text/csv'
          filename += '.csv'
          break
        case 'pdf':
          // For PDF, we'll create a simple text representation
          mimeType = 'text/plain'
          filename += '.txt'
          break
        default:
          throw new Error('Invalid export format')
      }

      // Create and download file
      const blob = new Blob([selectedFormat === 'json' ? JSON.stringify(data, null, 2) : 
                            selectedFormat === 'csv' ? convertToCSV(data, selectedType) : 
                            createPDFContent(data, selectedType)], { type: mimeType })
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      onExportComplete?.(filename)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed'
      setExportError(errorMessage)
      onExportError?.(errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  const convertToCSV = (data: any, type: ExportType): string => {
    if (type === 'sessions' && Array.isArray(data)) {
      const headers = ['ID', 'Role', 'Start Time', 'Last Saved', 'Status', 'Questions Count']
      const rows = data.map(session => [
        session.id,
        session.role,
        new Date(session.startTime).toLocaleString(),
        new Date(session.lastSaved).toLocaleString(),
        session.status,
        session.questions?.length || 0
      ])
      
      return [headers, ...rows].map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n')
    }
    
    if (type === 'profile') {
      const headers = ['Field', 'Value']
      const rows = Object.entries(data).map(([key, value]) => [key, String(value)])
      return [headers, ...rows].map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n')
    }
    
    // For 'all' type, create a summary
    const headers = ['Type', 'Count', 'Last Updated']
    const rows = [
      ['User Profile', '1', new Date().toISOString()],
      ['Sessions', data.sessions?.length || 0, new Date().toISOString()]
    ]
    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')
  }

  const createPDFContent = (data: any, type: ExportType): string => {
    let content = `Confida Data Export\n`
    content += `Generated: ${new Date().toLocaleString()}\n`
    content += `Type: ${type}\n\n`
    
    if (type === 'sessions' && Array.isArray(data)) {
      content += `Sessions (${data.length} total):\n`
      data.forEach((session, index) => {
        content += `\n${index + 1}. ${session.role}\n`
        content += `   ID: ${session.id}\n`
        content += `   Started: ${new Date(session.startTime).toLocaleString()}\n`
        content += `   Status: ${session.status}\n`
        content += `   Questions: ${session.questions?.length || 0}\n`
      })
    } else if (type === 'profile') {
      content += `User Profile:\n`
      Object.entries(data).forEach(([key, value]) => {
        content += `${key}: ${value}\n`
      })
    } else if (type === 'all') {
      content += `Complete Data Export:\n\n`
      content += `User Profile:\n`
      Object.entries(data.user || {}).forEach(([key, value]) => {
        content += `  ${key}: ${value}\n`
      })
      content += `\nSessions (${data.sessions?.length || 0} total):\n`
      data.sessions?.forEach((session: any, index: number) => {
        content += `\n  ${index + 1}. ${session.role}\n`
        content += `     ID: ${session.id}\n`
        content += `     Started: ${new Date(session.startTime).toLocaleString()}\n`
        content += `     Status: ${session.status}\n`
      })
    }
    
    return content
  }

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner message="Loading data..." />
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
      
      {/* Export Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          What to export
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { value: 'all', label: 'All Data', description: 'Profile + Sessions' },
            { value: 'sessions', label: 'Sessions Only', description: 'Interview sessions' },
            { value: 'profile', label: 'Profile Only', description: 'User profile data' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedType(option.value as ExportType)}
              className={`p-3 text-left border rounded-lg transition-colors ${
                selectedType === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-gray-500">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Export Format Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Export format
        </label>
        <div className="flex space-x-4">
          {[
            { value: 'json', label: 'JSON', description: 'Structured data' },
            { value: 'csv', label: 'CSV', description: 'Spreadsheet format' },
            { value: 'pdf', label: 'Text', description: 'Human readable' }
          ].map((format) => (
            <label key={format.value} className="flex items-center">
              <input
                type="radio"
                name="format"
                value={format.value}
                checked={selectedFormat === format.value}
                onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                className="mr-2"
              />
              <div>
                <div className="text-sm font-medium">{format.label}</div>
                <div className="text-xs text-gray-500">{format.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Data Summary */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <div>User Profile: {userData ? 'Available' : 'Not available'}</div>
          <div>Sessions: {sessionHistory?.length || 0} found</div>
          <div>Export will include: {selectedType === 'all' ? 'Profile + Sessions' : selectedType}</div>
        </div>
      </div>

      {/* Error Display */}
      {exportError && (
        <div className="mb-4">
          <ErrorMessage 
            error={exportError}
            onDismiss={() => setExportError(null)}
            showNetworkStatus={false}
          />
        </div>
      )}

      {/* Export Button */}
      <Button
        onClick={handleExport}
        disabled={isExporting || !userData}
        className="w-full"
      >
        {isExporting ? (
          <>
            <LoadingSpinner />
            <span className="ml-2">Exporting...</span>
          </>
        ) : (
          `Export ${selectedType} as ${selectedFormat.toUpperCase()}`
        )}
      </Button>

      {/* Export Info */}
      <div className="mt-3 text-xs text-gray-500">
        <p>• Exported data will be downloaded to your device</p>
        <p>• Data includes your interview sessions and profile information</p>
        <p>• You can import this data later if needed</p>
      </div>
    </Card>
  )
}

export default DataExport
