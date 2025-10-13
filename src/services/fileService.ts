import { API_CONFIG } from '../config/api'
import { logger } from '../utils/logger'
import { networkManager } from '../utils/networkUtils'
import { authService } from './authService'
import {
  FileType,
  FileUploadResponse,
  FileInfo,
  FileListResponse,
  FileDeleteResponse,
  FileUploadRequest,
  FileListRequest,
  FileDownloadRequest,
  ApiErrorResponse,
  validateFileSize,
  validateFileType,
  getFileTypeFromExtension
} from '../types/fileOperations'

export interface FileServiceError extends Error {
  status?: number
  code?: string
  retryable: boolean
  userMessage: string
}

export class FileService {
  private baseURL: string
  private defaultTimeout: number = 60000 // 60 seconds for file operations

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  private createFileError(
    message: string,
    originalError: Error,
    status: number | undefined = undefined,
    retryable: boolean = true
  ): FileServiceError {
    const error = new Error(message) as FileServiceError
    if (status !== undefined) {
      error.status = status
    }
    error.retryable = retryable
    error.userMessage = this.getUserFriendlyMessage(originalError, status)
    return error
  }

  private getUserFriendlyMessage(error: Error, status?: number): string {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.'
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return 'The file upload is taking longer than expected. Please try again.'
    }

    // HTTP status codes
    if (status) {
      switch (status) {
        case 400:
          return 'There was an issue with your file. Please check the file format and size.'
        case 401:
          return 'You need to be logged in to upload files.'
        case 403:
          return 'You don\'t have permission to upload files.'
        case 404:
          return 'The requested file was not found.'
        case 413:
          return 'File is too large. Please choose a smaller file.'
        case 415:
          return 'File type not supported. Please choose a different file format.'
        case 429:
          return 'Too many upload requests. Please wait a moment and try again.'
        case 500:
          return 'Our servers are experiencing issues. Please try again in a few moments.'
        case 502:
        case 503:
        case 504:
          return 'The file service is temporarily unavailable. Please try again later.'
        default:
          return `Server error (${status}). Please try again.`
      }
    }

    return 'An unexpected error occurred while processing your file. Please try again.'
  }

  private async makeRequest<T>(
    endpoint: string,
    data: FormData | Record<string, any>,
    method: 'GET' | 'POST' | 'DELETE' = 'POST',
    options: {
      timeout?: number
      retries?: number
      retryDelay?: number
      isFormData?: boolean
    } = {}
  ): Promise<T> {
    const { timeout = this.defaultTimeout, retries = 3, retryDelay = 1000, isFormData = false } = options
    
    // Check network status before making request
    if (!networkManager.isOnline()) {
      throw this.createFileError(
        'No internet connection available',
        new Error('Offline'),
        undefined,
        true
      )
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const headers: Record<string, string> = {}
        if (!isFormData) {
          headers['Content-Type'] = 'application/json'
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method,
          headers,
          body: isFormData ? data as FormData : JSON.stringify(data),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          let errorData: ApiErrorResponse | null = null
          
          try {
            errorData = JSON.parse(errorText)
          } catch {
            // If parsing fails, use the raw text
          }

          lastError = this.createFileError(
            errorData?.detail || `HTTP ${response.status}: ${response.statusText}`,
            new Error(errorData?.detail || response.statusText),
            response.status,
            response.status >= 500 || response.status === 429
          )
          
          // Don't retry on client errors (4xx except 429)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw lastError
          }
          
          // If this is the last attempt, throw the error
          if (attempt >= retries) {
            throw lastError
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
          continue
        }

        return await response.json()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        // Handle abort (timeout)
        if (lastError.name === 'AbortError') {
          lastError = this.createFileError(
            'Request timeout',
            lastError,
            undefined,
            true
          )
        }
        
        // Handle network errors
        if (lastError.name === 'TypeError' && lastError.message.includes('fetch')) {
          lastError = this.createFileError(
            'Network error: Unable to connect to server',
            lastError,
            undefined,
            true
          )
        }

        // Don't retry on non-retryable errors
        if (lastError instanceof Error && 'retryable' in lastError && !lastError.retryable) {
          throw lastError
        }

        // If this is the last attempt, throw the error
        if (attempt >= retries) {
          throw lastError
        }

        // Log retry attempt
        logger.warn(`File service request failed (attempt ${attempt + 1}/${retries + 1}):`, lastError)
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Request failed after all retries')
  }

  private validateFile(file: File, expectedType?: FileType): void {
    // Validate file type
    const detectedType = validateFileType(file)
    if (!detectedType) {
      throw this.createFileError(
        'Unsupported file type',
        new Error('Invalid file type'),
        415,
        false
      )
    }

    // Validate against expected type if provided
    if (expectedType && detectedType !== expectedType) {
      throw this.createFileError(
        `Expected ${expectedType} file, got ${detectedType}`,
        new Error('File type mismatch'),
        400,
        false
      )
    }

    // Validate file size
    if (!validateFileSize(file, detectedType)) {
      throw this.createFileError(
        `File is too large for ${detectedType} type`,
        new Error('File too large'),
        413,
        false
      )
    }
  }

  // General file upload
  async uploadFile(
    file: File,
    fileType: FileType,
    description?: string,
    options?: { timeout?: number; retries?: number }
  ): Promise<FileUploadResponse> {
    this.validateFile(file, fileType)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('file_type', fileType)
    if (description) {
      formData.append('description', description)
    }

    return this.makeRequest<FileUploadResponse>(
      API_CONFIG.ENDPOINTS.files.upload,
      formData,
      'POST',
      { ...options, isFormData: true }
    )
  }

  // Type-specific uploads
  async uploadAudioFile(
    file: File,
    description?: string,
    options?: { timeout?: number; retries?: number }
  ): Promise<FileUploadResponse> {
    this.validateFile(file, 'audio')

    const formData = new FormData()
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }

    return this.makeRequest<FileUploadResponse>(
      API_CONFIG.ENDPOINTS.files.audioUpload,
      formData,
      'POST',
      { ...options, isFormData: true }
    )
  }

  async uploadDocumentFile(
    file: File,
    description?: string,
    options?: { timeout?: number; retries?: number }
  ): Promise<FileUploadResponse> {
    this.validateFile(file, 'document')

    const formData = new FormData()
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }

    return this.makeRequest<FileUploadResponse>(
      API_CONFIG.ENDPOINTS.files.documentUpload,
      formData,
      'POST',
      { ...options, isFormData: true }
    )
  }

  async uploadImageFile(
    file: File,
    description?: string,
    options?: { timeout?: number; retries?: number }
  ): Promise<FileUploadResponse> {
    this.validateFile(file, 'image')

    const formData = new FormData()
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }

    return this.makeRequest<FileUploadResponse>(
      API_CONFIG.ENDPOINTS.files.imageUpload,
      formData,
      'POST',
      { ...options, isFormData: true }
    )
  }

  // File retrieval
  async getFile(fileId: string): Promise<FileInfo> {
    return this.makeRequest<FileInfo>(
      `${API_CONFIG.ENDPOINTS.files.get}/${fileId}`,
      {},
      'GET'
    )
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const authHeader = this.getAuthToken()
    const headers: Record<string, string> = {}
    
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.files.download}/${fileId}/download`, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      throw this.createFileError(
        `Failed to download file: ${response.statusText}`,
        new Error(response.statusText),
        response.status,
        false
      )
    }

    return response.blob()
  }

  // File listing
  async listFiles(
    fileType?: FileType,
    page: number = 1,
    pageSize: number = 20
  ): Promise<FileListResponse> {
    const params = new URLSearchParams()
    if (fileType) params.append('file_type', fileType)
    params.append('page', page.toString())
    params.append('page_size', pageSize.toString())

    return this.makeRequest<FileListResponse>(
      `${API_CONFIG.ENDPOINTS.files.get}?${params.toString()}`,
      {},
      'GET'
    )
  }

  async listAudioFiles(page: number = 1, pageSize: number = 20): Promise<FileListResponse> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('page_size', pageSize.toString())

    return this.makeRequest<FileListResponse>(
      `${API_CONFIG.ENDPOINTS.files.audioList}?${params.toString()}`,
      {},
      'GET'
    )
  }

  async listDocumentFiles(page: number = 1, pageSize: number = 20): Promise<FileListResponse> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('page_size', pageSize.toString())

    return this.makeRequest<FileListResponse>(
      `${API_CONFIG.ENDPOINTS.files.documentList}?${params.toString()}`,
      {},
      'GET'
    )
  }

  async listImageFiles(page: number = 1, pageSize: number = 20): Promise<FileListResponse> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('page_size', pageSize.toString())

    return this.makeRequest<FileListResponse>(
      `${API_CONFIG.ENDPOINTS.files.imageList}?${params.toString()}`,
      {},
      'GET'
    )
  }

  // File deletion
  async deleteFile(fileId: string): Promise<FileDeleteResponse> {
    return this.makeRequest<FileDeleteResponse>(
      `${API_CONFIG.ENDPOINTS.files.delete}/${fileId}`,
      {},
      'DELETE'
    )
  }

  // Helper method to get auth token from auth service
  private getAuthToken(): string | null {
    return authService.getAuthHeader()
  }
}

// Create a singleton instance
export const fileService = new FileService()
