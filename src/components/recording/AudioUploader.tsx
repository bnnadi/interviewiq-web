import React, { useState, useRef, useCallback } from 'react'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import LoadingSpinner from '@components/shared/ui/LoadingSpinner'
import ErrorMessage from '@components/shared/ui/ErrorMessage'
import { speechApiService, SpeechTranscriptionResult, SpeechAnalysisResult } from '../../services/speechApiService'
import { validateAudioFile, formatFileSize, formatDuration } from '../../utils/audioUtils'
import { ProcessedTranscription } from '../../utils/transcriptionUtils'

interface AudioUploaderProps {
  onTranscriptionComplete?: (transcription: ProcessedTranscription) => void
  onTranscriptionUpdate?: (transcription: ProcessedTranscription) => void
  onError?: (error: string) => void
  language?: string
  enableAnalysis?: boolean
  maxFileSize?: number
  acceptedFormats?: string[]
  className?: string
}

const AudioUploader: React.FC<AudioUploaderProps> = ({
  onTranscriptionComplete,
  onTranscriptionUpdate,
  onError,
  language = 'en-US',
  enableAnalysis = true,
  maxFileSize = 25 * 1024 * 1024, // 25MB
  acceptedFormats = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg'],
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<ProcessedTranscription | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    setError(null)
    setTranscription(null)

    // Validate file
    const validation = validateAudioFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      onError?.(validation.error || 'Invalid file')
      return
    }

    // Check file size
    if (file.size > maxFileSize) {
      const errorMsg = `File too large: ${formatFileSize(file.size)}. Maximum size: ${formatFileSize(maxFileSize)}`
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    setSelectedFile(file)
  }, [maxFileSize, onError])

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 200)

      // Upload and transcribe
      const result = await speechApiService.uploadAudioFile(selectedFile, {
        language,
        enableAnalysis
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Process transcription
      const processedTranscription: ProcessedTranscription = {
        fullText: result.transcription.transcript,
        segments: [{
          text: result.transcription.transcript,
          startTime: 0,
          endTime: 0, // Duration not available from file upload
          confidence: result.transcription.confidence,
          isFinal: true
        }],
        confidence: result.transcription.confidence,
        wordCount: result.transcription.transcript.split(/\s+/).length,
        duration: 0, // Duration not available from file upload
        analysis: result.analysis
      }

      setTranscription(processedTranscription)
      onTranscriptionComplete?.(processedTranscription)
      onTranscriptionUpdate?.(processedTranscription)

      // Show analysis if available
      if (result.analysis) {
        setIsAnalyzing(true)
        setTimeout(() => setIsAnalyzing(false), 2000)
      }

      logger.info('Audio file uploaded and transcribed successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      onError?.(errorMessage)
      logger.error('Audio upload failed:', err)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [selectedFile, language, enableAnalysis, onTranscriptionComplete, onTranscriptionUpdate, onError])

  // Handle reset
  const handleReset = useCallback(() => {
    setSelectedFile(null)
    setTranscription(null)
    setError(null)
    setUploadProgress(0)
    setIsUploading(false)
    setIsAnalyzing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upload Audio File</h3>
        {isUploading && <LoadingSpinner />}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4">
          <ErrorMessage 
            error={error}
            onDismiss={() => setError(null)}
            showNetworkStatus={false}
          />
        </div>
      )}

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : selectedFile
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="space-y-3">
            <div className="text-green-600">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? 'Uploading...' : 'Upload & Transcribe'}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={isUploading}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-gray-400">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Drop your audio file here, or{' '}
                <button
                  onClick={handleClick}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: {acceptedFormats.map(format => format.split('/')[1]).join(', ')}
              </p>
              <p className="text-xs text-gray-500">
                Maximum size: {formatFileSize(maxFileSize)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Analysis Indicator */}
      {isAnalyzing && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <LoadingSpinner />
            <span className="text-sm text-blue-800">Analyzing speech patterns...</span>
          </div>
        </div>
      )}

      {/* Transcription Results */}
      {transcription && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">Transcription Results</h4>
            <div className="text-xs text-gray-500">
              {Math.round(transcription.confidence * 100)}% confidence
            </div>
          </div>
          
          <div className="text-sm text-gray-700 mb-3">
            {transcription.fullText}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>Words: {transcription.wordCount}</div>
            <div>Segments: {transcription.segments.length}</div>
            <div>Confidence: {Math.round(transcription.confidence * 100)}%</div>
            <div>Analysis: {transcription.analysis ? 'Completed' : 'Not available'}</div>
          </div>

          {transcription.analysis && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-2">Speech Analysis:</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                <div>Speaking Rate: {transcription.analysis.speakingRate} WPM</div>
                <div>Clarity: {Math.round(transcription.analysis.clarity * 100)}%</div>
                <div>Filler Words: {transcription.analysis.fillerWords.length}</div>
                <div>Tone: {transcription.analysis.tone}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-1">Instructions</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Upload audio files in supported formats (WebM, WAV, MP3, M4A, OGG)</li>
          <li>• Maximum file size is {formatFileSize(maxFileSize)}</li>
          <li>• Audio will be transcribed and analyzed automatically</li>
          <li>• Results include confidence scores and speech analysis</li>
        </ul>
      </div>
    </Card>
  )
}

export default AudioUploader
