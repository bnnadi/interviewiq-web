import React, { useState, useCallback, useRef } from 'react'
import { FileType, validateFileSize, validateFileType, FILE_SIZE_LIMITS } from '../../types/fileOperations'
import { fileService } from '../../services/fileService'
import { logger } from '../../utils/logger'

interface FileUploadProps {
  fileType: FileType
  onUploadSuccess: (fileId: string, filename: string) => void
  onUploadError: (error: string) => void
  description?: string
  className?: string
  disabled?: boolean
  maxFiles?: number
}

interface UploadProgress {
  file: File
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
  fileType,
  onUploadSuccess,
  onUploadError,
  description,
  className = '',
  disabled = false,
  maxFiles = 1
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const detectedType = validateFileType(file)
    if (!detectedType || detectedType !== fileType) {
      return `Please select a ${fileType} file`
    }

    // Check file size
    if (!validateFileSize(file, fileType)) {
      const maxSizeMB = Math.round(FILE_SIZE_LIMITS[fileType] / (1024 * 1024))
      return `File size must be less than ${maxSizeMB}MB`
    }

    return null
  }, [fileType])

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (disabled || isUploading) return

    const fileArray = Array.from(files)
    if (fileArray.length > maxFiles) {
      onUploadError(`Please select no more than ${maxFiles} file(s)`)
      return
    }

    setIsUploading(true)

    // Validate all files first
    const validationErrors: string[] = []
    fileArray.forEach((file, index) => {
      const error = validateFile(file)
      if (error) {
        validationErrors.push(`${file.name}: ${error}`)
      }
    })

    if (validationErrors.length > 0) {
      onUploadError(validationErrors.join('\n'))
      setIsUploading(false)
      return
    }

    // Initialize upload progress
    const initialUploads: UploadProgress[] = fileArray.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }))
    setUploads(initialUploads)

    // Upload files
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      
      try {
        const response = await fileService.uploadFile(file, fileType, description)
        
        // Update progress to completed
        setUploads(prev => prev.map((upload, index) => 
          index === i 
            ? { ...upload, progress: 100, status: 'completed' }
            : upload
        ))

        onUploadSuccess(response.file_id, response.filename)
        logger.info(`File uploaded successfully: ${response.filename}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        const userMessage = error && typeof error === 'object' && 'userMessage' in error 
          ? (error as any).userMessage 
          : errorMessage
        
        // Update progress to error
        setUploads(prev => prev.map((upload, index) => 
          index === i 
            ? { ...upload, progress: 0, status: 'error', error: userMessage }
            : upload
        ))

        onUploadError(userMessage)
        logger.error(`File upload failed: ${file.name}`, error)
      }
    }

    setIsUploading(false)
  }, [fileType, description, onUploadSuccess, onUploadError, disabled, isUploading, maxFiles, validateFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isUploading) {
      setIsDragOver(true)
    }
  }, [disabled, isUploading])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled || isUploading) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }, [disabled, isUploading, handleFileSelect])

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
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled, isUploading])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileTypeIcon = (type: FileType): string => {
    switch (type) {
      case 'audio': return '🎵'
      case 'document': return '📄'
      case 'image': return '🖼️'
      default: return '📁'
    }
  }

  return (
    <div className={`file-upload ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled || isUploading 
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
          accept={fileType === 'audio' ? 'audio/*' : fileType === 'image' ? 'image/*' : '.pdf,.doc,.docx,.txt,.rtf'}
          multiple={maxFiles > 1}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
        
        <div className="space-y-2">
          <div className="text-4xl">{getFileTypeIcon(fileType)}</div>
          <div className="text-lg font-medium text-gray-700">
            {isUploading ? 'Uploading...' : `Upload ${fileType} file${maxFiles > 1 ? 's' : ''}`}
          </div>
          <div className="text-sm text-gray-500">
            Drag and drop your {fileType} file{maxFiles > 1 ? 's' : ''} here, or click to browse
          </div>
          <div className="text-xs text-gray-400">
            Max size: {Math.round(FILE_SIZE_LIMITS[fileType] / (1024 * 1024))}MB
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploads.map((upload, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate">
                  {upload.file.name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatFileSize(upload.file.size)}
                </span>
              </div>
              
              {upload.status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
              
              {upload.status === 'completed' && (
                <div className="flex items-center text-green-600 text-sm">
                  <span className="mr-2">✓</span>
                  Upload completed
                </div>
              )}
              
              {upload.status === 'error' && (
                <div className="flex items-center text-red-600 text-sm">
                  <span className="mr-2">✗</span>
                  {upload.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
