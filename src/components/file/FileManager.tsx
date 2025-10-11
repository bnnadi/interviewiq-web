import React, { useState, useEffect, useCallback } from 'react'
import { FileType, FileInfo, FileListResponse } from '../../types/fileOperations'
import { fileService } from '../../services/fileService'
import { logger } from '../../utils/logger'

interface FileManagerProps {
  fileType?: FileType
  onFileSelect?: (file: FileInfo) => void
  onFileDelete?: (fileId: string) => void
  className?: string
  showActions?: boolean
  pageSize?: number
}

export const FileManager: React.FC<FileManagerProps> = ({
  fileType,
  onFileSelect,
  onFileDelete,
  className = '',
  showActions = true,
  pageSize = 20
}) => {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const loadFiles = useCallback(async (page: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      let response: FileListResponse

      if (fileType) {
        // Use type-specific endpoint
        switch (fileType) {
          case 'audio':
            response = await fileService.listAudioFiles(page, pageSize)
            break
          case 'document':
            response = await fileService.listDocumentFiles(page, pageSize)
            break
          case 'image':
            response = await fileService.listImageFiles(page, pageSize)
            break
          default:
            response = await fileService.listFiles(fileType, page, pageSize)
        }
      } else {
        response = await fileService.listFiles(undefined, page, pageSize)
      }

      setFiles(response.files)
      setTotalCount(response.total_count)
      setHasNext(response.has_next)
      setCurrentPage(response.page)
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'userMessage' in error 
        ? (error as any).userMessage 
        : 'Failed to load files'
      setError(errorMessage)
      logger.error('Failed to load files:', error)
    } finally {
      setLoading(false)
    }
  }, [fileType, pageSize])

  useEffect(() => {
    loadFiles(1)
  }, [loadFiles])

  const handleFileClick = useCallback((file: FileInfo) => {
    setSelectedFile(file.file_id)
    onFileSelect?.(file)
  }, [onFileSelect])

  const handleDeleteFile = useCallback(async (fileId: string, filename: string) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return
    }

    try {
      await fileService.deleteFile(fileId)
      setFiles(prev => prev.filter(file => file.file_id !== fileId))
      onFileDelete?.(fileId)
      logger.info(`File deleted: ${filename}`)
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'userMessage' in error 
        ? (error as any).userMessage 
        : 'Failed to delete file'
      setError(errorMessage)
      logger.error('Failed to delete file:', error)
    }
  }, [onFileDelete])

  const handleDownloadFile = useCallback(async (file: FileInfo) => {
    try {
      const blob = await fileService.downloadFile(file.file_id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      logger.info(`File downloaded: ${file.filename}`)
    } catch (error) {
      const errorMessage = error && typeof error === 'object' && 'userMessage' in error 
        ? (error as any).userMessage 
        : 'Failed to download file'
      setError(errorMessage)
      logger.error('Failed to download file:', error)
    }
  }, [])

  const handlePageChange = useCallback((page: number) => {
    loadFiles(page)
  }, [loadFiles])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (fileType: FileType): string => {
    switch (fileType) {
      case 'audio': return '🎵'
      case 'document': return '📄'
      case 'image': return '🖼️'
      default: return '📁'
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'uploading': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  if (loading && files.length === 0) {
    return (
      <div className={`file-manager ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading files...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`file-manager ${className}`}>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => loadFiles(currentPage)}
              className="ml-auto text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {files.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📁</div>
          <div>No files found</div>
          {fileType && <div className="text-sm">Upload some {fileType} files to get started</div>}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.file_id}
                className={`
                  flex items-center p-4 border rounded-lg cursor-pointer transition-colors
                  ${selectedFile === file.file_id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleFileClick(file)}
              >
                <div className="flex-shrink-0 mr-3 text-2xl">
                  {getFileIcon(file.file_type)}
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {file.filename}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(file.status)}`}>
                      {file.status}
                    </span>
                  </div>
                  
                  <div className="mt-1 flex items-center text-xs text-gray-500 space-x-4">
                    <span>{formatFileSize(file.file_size)}</span>
                    <span>{formatDate(file.created_at)}</span>
                    <span className="capitalize">{file.file_type}</span>
                  </div>
                  
                  {file.metadata?.['description'] && (
                    <div className="mt-1 text-xs text-gray-600 truncate">
                      {file.metadata['description']}
                    </div>
                  )}
                </div>

                {showActions && (
                  <div className="flex-shrink-0 ml-3 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadFile(file)
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Download"
                    >
                      ⬇️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteFile(file.file_id, file.filename)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} files
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <span className="px-3 py-1 text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNext}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
