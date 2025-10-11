import React, { useState, useCallback, useRef } from 'react'
import { TranscriptionResponse, validateFileSize, validateFileType } from '../../types/fileOperations'
import { speechService } from '../../services/speechService'
import { logger } from '../../utils/logger'

interface SpeechTranscriberProps {
  onTranscriptionComplete: (transcription: string, confidence: number) => void
  onTranscriptionError: (error: string) => void
  className?: string
  disabled?: boolean
  autoTranscribe?: boolean
}

interface TranscriptionProgress {
  file: File
  status: 'uploading' | 'transcribing' | 'completed' | 'error'
  progress: number
  result?: TranscriptionResponse
  error?: string
}

export const SpeechTranscriber: React.FC<SpeechTranscriberProps> = ({
  onTranscriptionComplete,
  onTranscriptionError,
  className = '',
  disabled = false,
  autoTranscribe = true
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [transcriptions, setTranscriptions] = useState<TranscriptionProgress[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [language, setLanguage] = useState('en-US')
  const [saveFile, setSaveFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateAudioFile = useCallback((file: File): string | null => {
    // Check file type
    const detectedType = validateFileType(file)
    if (!detectedType || detectedType !== 'audio') {
      return 'Please select an audio file (MP3, WAV, M4A, OGG, FLAC)'
    }

    // Check file size
    if (!validateFileSize(file, 'audio')) {
      return 'Audio file is too large (max 50MB)'
    }

    return null
  }, [])

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (disabled || isProcessing) return

    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    setIsProcessing(true)

    // Validate all files first
    const validationErrors: string[] = []
    fileArray.forEach((file, index) => {
      const error = validateAudioFile(file)
      if (error) {
        validationErrors.push(`${file.name}: ${error}`)
      }
    })

    if (validationErrors.length > 0) {
      onTranscriptionError(validationErrors.join('\n'))
      setIsProcessing(false)
      return
    }

    // Initialize transcription progress
    const initialTranscriptions: TranscriptionProgress[] = fileArray.map(file => ({
      file,
      status: 'uploading',
      progress: 0
    }))
    setTranscriptions(initialTranscriptions)

    // Process files
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      
      try {
        // Update status to transcribing
        setTranscriptions(prev => prev.map((transcription, index) => 
          index === i 
            ? { ...transcription, status: 'transcribing', progress: 50 }
            : transcription
        ))

        const response = await speechService.transcribeAudio(
          file, 
          language, 
          saveFile
        )
        
        // Update progress to completed
        setTranscriptions(prev => prev.map((transcription, index) => 
          index === i 
            ? { 
                ...transcription, 
                status: 'completed', 
                progress: 100, 
                result: response 
              }
            : transcription
        ))

        onTranscriptionComplete(response.transcription, response.confidence)
        logger.info(`Transcription completed: ${file.name}`, { confidence: response.confidence })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Transcription failed'
        const userMessage = error && typeof error === 'object' && 'userMessage' in error 
          ? (error as any).userMessage 
          : errorMessage
        
        // Update progress to error
        setTranscriptions(prev => prev.map((transcription, index) => 
          index === i 
            ? { 
                ...transcription, 
                status: 'error', 
                progress: 0, 
                error: userMessage 
              }
            : transcription
        ))

        onTranscriptionError(userMessage)
        logger.error(`Transcription failed: ${file.name}`, error)
      }
    }

    setIsProcessing(false)
  }, [language, saveFile, onTranscriptionComplete, onTranscriptionError, disabled, isProcessing, validateAudioFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isProcessing) {
      setIsDragOver(true)
    }
  }, [disabled, isProcessing])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled || isProcessing) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }, [disabled, isProcessing, handleFileSelect])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
    // Reset input value to allow re-uploading the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFileSelect])

  const handleClick = useCallback(() => {
    if (!disabled && !isProcessing && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled, isProcessing])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceDescription = (confidence: number): string => {
    return speechService.getConfidenceDescription(confidence)
  }

  return (
    <div className={`speech-transcriber ${className}`}>
      {/* Language and Options */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={disabled || isProcessing}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
              <option value="it-IT">Italian</option>
              <option value="pt-BR">Portuguese</option>
              <option value="ru-RU">Russian</option>
              <option value="ja-JP">Japanese</option>
              <option value="ko-KR">Korean</option>
            </select>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={saveFile}
              onChange={(e) => setSaveFile(e.target.checked)}
              disabled={disabled || isProcessing}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Save audio file</span>
          </label>
        </div>
      </div>

      {/* File Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled || isProcessing 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isProcessing}
        />
        
        <div className="space-y-2">
          <div className="text-4xl">🎵</div>
          <div className="text-lg font-medium text-gray-700">
            {isProcessing ? 'Processing...' : 'Upload audio files for transcription'}
          </div>
          <div className="text-sm text-gray-500">
            Drag and drop your audio files here, or click to browse
          </div>
          <div className="text-xs text-gray-400">
            Supported formats: MP3, WAV, M4A, OGG, FLAC (max 50MB)
          </div>
        </div>
      </div>

      {/* Transcription Progress */}
      {transcriptions.length > 0 && (
        <div className="mt-4 space-y-3">
          {transcriptions.map((transcription, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {transcription.file.name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatFileSize(transcription.file.size)}
                </span>
              </div>
              
              {transcription.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${transcription.progress}%` }}
                  />
                </div>
              )}
              
              {transcription.status === 'transcribing' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${transcription.progress}%` }}
                  />
                </div>
              )}
              
              {transcription.status === 'completed' && transcription.result && (
                <div className="space-y-2">
                  <div className="flex items-center text-green-600 text-sm">
                    <span className="mr-2">✓</span>
                    Transcription completed
                    <span className={`ml-2 text-xs ${getConfidenceColor(transcription.result.confidence)}`}>
                      ({getConfidenceDescription(transcription.result.confidence)} confidence)
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                    {transcription.result.transcription}
                  </div>
                </div>
              )}
              
              {transcription.status === 'error' && (
                <div className="flex items-center text-red-600 text-sm">
                  <span className="mr-2">✗</span>
                  {transcription.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
