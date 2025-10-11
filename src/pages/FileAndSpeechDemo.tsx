import React, { useState } from 'react'
import { FileAndSpeechIntegration } from '../components/integration/FileAndSpeechIntegration'
import { FileInfo } from '../types/fileOperations'
import { logger } from '../utils/logger'

const FileAndSpeechDemo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null)
  const [transcriptions, setTranscriptions] = useState<Array<{
    text: string
    confidence: number
    timestamp: Date
  }>>([])

  const handleFileSelected = (file: FileInfo) => {
    setSelectedFile(file)
    logger.info('File selected in demo:', file)
  }

  const handleTranscriptionComplete = (transcription: string, confidence: number) => {
    const newTranscription = {
      text: transcription,
      confidence,
      timestamp: new Date()
    }
    setTranscriptions(prev => [newTranscription, ...prev])
    logger.info('Transcription completed in demo:', { confidence })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            File Operations & Speech Integration Demo
          </h1>
          <p className="text-lg text-gray-600">
            Upload, manage, and transcribe files with our comprehensive file and speech services
          </p>
        </div>

        {/* Main Integration Component */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <FileAndSpeechIntegration
            onFileSelected={handleFileSelected}
            onTranscriptionComplete={handleTranscriptionComplete}
          />
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Selected File</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700">File Information</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div><strong>Name:</strong> {selectedFile.filename}</div>
                  <div><strong>Type:</strong> {selectedFile.file_type}</div>
                  <div><strong>Size:</strong> {Math.round(selectedFile.file_size / 1024)} KB</div>
                  <div><strong>Status:</strong> {selectedFile.status}</div>
                  <div><strong>Created:</strong> {new Date(selectedFile.created_at).toLocaleString()}</div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Actions</h3>
                <div className="mt-2 space-y-2">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Download File
                  </button>
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Transcribe (if audio)
                  </button>
                  <button className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    Delete File
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Transcription History */}
        {transcriptions.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Transcription History</h2>
            <div className="space-y-4">
              {transcriptions.map((transcription, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
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
                  <div className="text-gray-700">
                    {transcription.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Endpoints Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available API Endpoints</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">File Operations</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• POST /api/v1/files/upload - Upload files</li>
                <li>• GET /api/v1/files - List files</li>
                <li>• GET /api/v1/files/&#123;id&#125; - Get file info</li>
                <li>• GET /api/v1/files/&#123;id&#125;/download - Download file</li>
                <li>• DELETE /api/v1/files/&#123;id&#125; - Delete file</li>
                <li>• Type-specific endpoints for audio, documents, images</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Speech Integration</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• POST /api/v1/speech/transcribe - Transcribe audio</li>
                <li>• POST /api/v1/speech/transcribe/&#123;id&#125; - Transcribe saved file</li>
                <li>• GET /api/v1/speech/supported-formats - Get supported formats</li>
                <li>• GET /api/v1/speech/audio-files - List audio files</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">File Management</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Drag & drop file upload</li>
                <li>• Multiple file type support</li>
                <li>• File size validation</li>
                <li>• Progress tracking</li>
                <li>• File listing & pagination</li>
                <li>• Download & delete operations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Speech Processing</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Audio file transcription</li>
                <li>• Real-time audio recording</li>
                <li>• Multiple language support</li>
                <li>• Confidence scoring</li>
                <li>• Auto-transcription</li>
                <li>• Audio playback controls</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Integration</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Seamless API integration</li>
                <li>• Error handling & retry logic</li>
                <li>• Network status monitoring</li>
                <li>• TypeScript support</li>
                <li>• Responsive design</li>
                <li>• Accessibility features</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileAndSpeechDemo
