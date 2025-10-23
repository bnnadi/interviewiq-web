import React, { useState, useCallback, useRef } from 'react'
import { speechApiService, SpeechTranscriptionResponse } from '../../services/speechApiService'
import { logger } from '../../utils/logger'
import Button from '../shared/ui/Button'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Progress } from '../ui/Progress'
import { Badge } from '../ui/Badge'

export interface AudioUploaderProps {
  onTranscriptionComplete?: (result: SpeechTranscriptionResponse) => void
  onError?: (error: Error) => void
  onUploadStart?: () => void
  onUploadProgress?: (progress: number) => void
  className?: string
  maxFileSize?: number // in MB
  acceptedFormats?: string[]
  language?: string
  showPreview?: boolean
  showProgress?: boolean
  multiple?: boolean
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  onTranscriptionComplete,
  onError,
  onUploadStart,
  onUploadProgress,
  className = '',
  maxFileSize = 50, // 50MB default
  acceptedFormats = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg'],
  language = 'en-US',
  showPreview = true,
  showProgress = true,
  multiple = false
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [transcriptionResults, setTranscriptionResults] = useState<SpeechTranscriptionResponse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`
    }

    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `File type not supported. Accepted formats: ${acceptedFormats.join(', ')}`
    }

    return null
  }, [maxFileSize, acceptedFormats])

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const errors: string[] = []

    // Validate files
    fileArray.forEach(file => {
      const validationError = validateFile(file)
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      const errorMessage = errors.join('\n')
      setError(errorMessage)
      onError?.(new Error(errorMessage))
      return
    }

    if (validFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    onUploadStart?.()

    try {
      const results: SpeechTranscriptionResponse[] = []

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        if (file) {
          logger.info('Uploading audio file:', { fileName: file.name, fileSize: file.size })

          try {
            const result = await speechApiService.uploadAudioFile(file, language)
            results.push(result)
            onTranscriptionComplete?.(result)
          } catch (err) {
            logger.error('Failed to transcribe file:', err)
            const error = err instanceof Error ? err : new Error('Transcription failed')
            onError?.(error)
            throw error
          }

          // Update progress
          const progress = ((i + 1) / validFiles.length) * 100
          setUploadProgress(progress)
          onUploadProgress?.(progress)
        }
      }

      setTranscriptionResults(prev => [...prev, ...results])
      setUploadedFiles(prev => [...prev, ...validFiles])
      
      logger.info('All files uploaded successfully:', { count: validFiles.length })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed')
      logger.error('Upload failed:', error)
      setError(error.message)
      onError?.(error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [validateFile, language, onTranscriptionComplete, onError, onUploadStart, onUploadProgress])

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
    }
  }, [handleFileUpload])

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }, [handleFileUpload])

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Clear all results
  const clearResults = useCallback(() => {
    setUploadedFiles([])
    setTranscriptionResults([])
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Remove specific file
  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    setTranscriptionResults(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format duration
  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Audio File Upload</h3>
          {uploadedFiles.length > 0 && (
            <Button onClick={clearResults} variant="outline" size="sm">
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
          </div>
        )}

        {/* Upload Area */}
        <div
          ref={dropZoneRef}
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileInputChange}
            multiple={multiple}
            className="hidden"
          />

          <div className="space-y-2">
            <div className="text-4xl text-gray-400">🎵</div>
            <div className="text-lg font-medium text-gray-700">
              {isUploading ? 'Uploading...' : 'Drop audio files here or click to browse'}
            </div>
            <div className="text-sm text-gray-500">
              Max file size: {maxFileSize}MB
            </div>
            <div className="text-xs text-gray-400">
              Supported formats: {acceptedFormats.join(', ')}
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {showProgress && isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Uploading...</span>
              <span className="text-gray-600">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Uploaded Files Preview */}
        {showPreview && uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => {
                const result = transcriptionResults[index]
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {file.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(file.size)}
                        </Badge>
                      </div>
                      {result && (
                        <div className="mt-1 text-xs text-gray-600">
                          <span>Duration: {formatDuration(result.duration)}</span>
                          <span className="mx-2">•</span>
                          <span>Confidence: {Math.round(result.confidence * 100)}%</span>
                          <span className="mx-2">•</span>
                          <span>Words: {result.transcript.split(/\s+/).length}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => removeFile(index)}
                      variant="outline"
                      size="sm"
                      className="ml-2"
                    >
                      Remove
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Transcription Results */}
        {transcriptionResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Transcription Results</h4>
            <div className="space-y-3">
              {transcriptionResults.map((result, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      File {index + 1}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {Math.round(result.confidence * 100)}% confidence
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatDuration(result.duration)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-800 bg-white p-2 rounded border">
                    {result.transcript}
                  </div>
                  {result.segments && result.segments.length > 0 && (
                    <div className="mt-2">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          Show segments ({result.segments.length})
                        </summary>
                        <div className="mt-1 space-y-1">
                          {result.segments.map((segment, segIndex) => (
                            <div key={segIndex} className="flex items-center justify-between p-1 bg-white rounded text-xs">
                              <span className="text-gray-700">{segment.text}</span>
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-500">
                                  {Math.round(segment.startTime / 1000)}s
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(segment.confidence * 100)}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AudioUploader