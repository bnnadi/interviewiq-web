import React, { useState, useCallback } from 'react'
import { FileType, FileInfo } from '../../types/fileOperations'
import { FileUpload } from '../file/FileUpload'
import { FileManager } from '../file/FileManager'
import { SpeechTranscriber } from '../speech/SpeechTranscriber'
import { EnhancedAudioRecorder } from '../speech/EnhancedAudioRecorder'
import { logger } from '../../utils/logger'

interface FileAndSpeechIntegrationProps {
  className?: string
  onTranscriptionComplete?: (transcription: string, confidence: number) => void
  onFileSelected?: (file: FileInfo) => void
}

type TabType = 'upload' | 'manage' | 'transcribe' | 'record'

export const FileAndSpeechIntegration: React.FC<FileAndSpeechIntegrationProps> = ({
  className = '',
  onTranscriptionComplete,
  onFileSelected
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('upload')
  const [selectedFileType, setSelectedFileType] = useState<FileType>('audio')
  const [transcriptions, setTranscriptions] = useState<Array<{
    id: string
    text: string
    confidence: number
    timestamp: Date
  }>>([])
  const [error, setError] = useState<string | null>(null)

  const handleUploadSuccess = useCallback((fileId: string, filename: string) => {
    logger.info(`File uploaded successfully: ${filename} (ID: ${fileId})`)
    setError(null)
  }, [])

  const handleUploadError = useCallback((error: string) => {
    setError(error)
    logger.error('Upload error:', error)
  }, [])

  const handleFileSelect = useCallback((file: FileInfo) => {
    onFileSelected?.(file)
    logger.info(`File selected: ${file.filename}`)
  }, [onFileSelected])

  const handleFileDelete = useCallback((fileId: string) => {
    logger.info(`File deleted: ${fileId}`)
    setError(null)
  }, [])

  const handleTranscriptionComplete = useCallback((transcription: string, confidence: number) => {
    const newTranscription = {
      id: Date.now().toString(),
      text: transcription,
      confidence,
      timestamp: new Date()
    }
    
    setTranscriptions(prev => [newTranscription, ...prev])
    onTranscriptionComplete?.(transcription, confidence)
    
    logger.info('Transcription completed', { confidence })
  }, [onTranscriptionComplete])

  const handleTranscriptionError = useCallback((error: string) => {
    setError(error)
    logger.error('Transcription error:', error)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearTranscriptions = useCallback(() => {
    setTranscriptions([])
  }, [])

  const tabs = [
    { id: 'upload' as TabType, label: 'Upload Files', icon: '📤' },
    { id: 'manage' as TabType, label: 'Manage Files', icon: '📁' },
    { id: 'transcribe' as TabType, label: 'Transcribe Audio', icon: '🎵' },
    { id: 'record' as TabType, label: 'Record Audio', icon: '🎤' }
  ]

  return (
    <div className={`file-speech-integration ${className}`}>
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Files</h3>
              
              {/* File Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Type
                </label>
                <div className="flex space-x-4">
                  {(['audio', 'document', 'image'] as FileType[]).map((type) => (
                    <label key={type} className="flex items-center">
                      <input
                        type="radio"
                        name="fileType"
                        value={type}
                        checked={selectedFileType === type}
                        onChange={(e) => setSelectedFileType(e.target.value as FileType)}
                        className="mr-2"
                      />
                      <span className="capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <FileUpload
                fileType={selectedFileType}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                description={`Uploaded via ${selectedFileType} tab`}
              />
            </div>
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">File Management</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by File Type
              </label>
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value as FileType)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="audio">Audio</option>
                <option value="document">Document</option>
                <option value="image">Image</option>
              </select>
            </div>

            <FileManager
              fileType={selectedFileType || undefined}
              onFileSelect={handleFileSelect}
              onFileDelete={handleFileDelete}
              showActions={true}
            />
          </div>
        )}

        {/* Transcribe Tab */}
        {activeTab === 'transcribe' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Transcribe Audio Files</h3>
            
            <SpeechTranscriber
              onTranscriptionComplete={handleTranscriptionComplete}
              onTranscriptionError={handleTranscriptionError}
              autoTranscribe={true}
            />
          </div>
        )}

        {/* Record Tab */}
        {activeTab === 'record' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Record and Transcribe Audio</h3>
            
            <EnhancedAudioRecorder
              onTranscriptionComplete={handleTranscriptionComplete}
              onTranscriptionError={handleTranscriptionError}
              autoTranscribe={true}
              maxDuration={300}
            />
          </div>
        )}
      </div>

      {/* Transcription History */}
      {transcriptions.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Transcription History</h3>
            <button
              onClick={clearTranscriptions}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {transcriptions.map((transcription) => (
              <div key={transcription.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">
                    {transcription.timestamp.toLocaleString()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    transcription.confidence >= 0.8 
                      ? 'bg-green-100 text-green-800'
                      : transcription.confidence >= 0.6
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {Math.round(transcription.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="text-sm text-gray-700">
                  {transcription.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
