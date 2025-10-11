import { API_CONFIG } from '../config/api'
import { logger } from '../utils/logger'
import { networkManager } from '../utils/networkUtils'
import {
  TranscriptionResponse,
  TranscriptionRequest,
  TranscriptionFromFileRequest,
  SupportedFormatsResponse,
  AudioFileInfo,
  AudioFileListRequest,
  ApiErrorResponse,
  validateFileSize,
  validateFileType
} from '../types/fileOperations'

export interface SpeechServiceError extends Error {
  status?: number
  code?: string
  retryable: boolean
  userMessage: string
}

export class SpeechService {
  private baseURL: string
  private defaultTimeout: number = 120000 // 2 minutes for transcription

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  private createSpeechError(
    message: string,
    originalError: Error,
    status: number | undefined = undefined,
    retryable: boolean = true
  ): SpeechServiceError {
    const error = new Error(message) as SpeechServiceError
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
      return 'The transcription is taking longer than expected. Please try again.'
    }

    // HTTP status codes
    if (status) {
      switch (status) {
        case 400:
          return 'There was an issue with your audio file. Please check the format and try again.'
        case 401:
          return 'You need to be logged in to use speech services.'
        case 403:
          return 'You don\'t have permission to use speech services.'
        case 404:
          return 'The requested audio file was not found.'
        case 413:
          return 'Audio file is too large. Please choose a smaller file.'
        case 415:
          return 'Audio format not supported. Please choose a different audio format.'
        case 429:
          return 'Too many transcription requests. Please wait a moment and try again.'
        case 500:
          return 'Our speech processing servers are experiencing issues. Please try again in a few moments.'
        case 502:
        case 503:
        case 504:
          return 'The speech service is temporarily unavailable. Please try again later.'
        default:
          return `Server error (${status}). Please try again.`
      }
    }

    return 'An unexpected error occurred while processing your audio. Please try again.'
  }

  private async makeRequest<T>(
    endpoint: string,
    data: FormData | Record<string, any>,
    method: 'GET' | 'POST' = 'POST',
    options: {
      timeout?: number
      retries?: number
      retryDelay?: number
      isFormData?: boolean
    } = {}
  ): Promise<T> {
    const { timeout = this.defaultTimeout, retries = 3, retryDelay = 2000, isFormData = false } = options
    
    // Check network status before making request
    if (!networkManager.isOnline()) {
      throw this.createSpeechError(
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

          lastError = this.createSpeechError(
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
          lastError = this.createSpeechError(
            'Request timeout',
            lastError,
            undefined,
            true
          )
        }
        
        // Handle network errors
        if (lastError.name === 'TypeError' && lastError.message.includes('fetch')) {
          lastError = this.createSpeechError(
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
        logger.warn(`Speech service request failed (attempt ${attempt + 1}/${retries + 1}):`, lastError)
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Request failed after all retries')
  }

  private validateAudioFile(file: File): void {
    // Validate file type
    const detectedType = validateFileType(file)
    if (!detectedType || detectedType !== 'audio') {
      throw this.createSpeechError(
        'File must be an audio file',
        new Error('Invalid file type'),
        415,
        false
      )
    }

    // Validate file size
    if (!validateFileSize(file, 'audio')) {
      throw this.createSpeechError(
        'Audio file is too large',
        new Error('File too large'),
        413,
        false
      )
    }
  }

  // Transcribe audio file
  async transcribeAudio(
    audioFile: File,
    language: string = 'en-US',
    saveFile: boolean = false,
    options?: { timeout?: number; retries?: number }
  ): Promise<TranscriptionResponse> {
    this.validateAudioFile(audioFile)

    const formData = new FormData()
    formData.append('audio_file', audioFile)
    formData.append('language', language)
    formData.append('save_file', saveFile.toString())

    return this.makeRequest<TranscriptionResponse>(
      API_CONFIG.ENDPOINTS.speech.transcribe,
      formData,
      'POST',
      { ...options, isFormData: true }
    )
  }

  // Transcribe from saved file
  async transcribeFromFile(
    fileId: string,
    language: string = 'en-US',
    options?: { timeout?: number; retries?: number }
  ): Promise<TranscriptionResponse> {
    const params = new URLSearchParams()
    params.append('language', language)

    return this.makeRequest<TranscriptionResponse>(
      `${API_CONFIG.ENDPOINTS.speech.transcribeFromFile}/${fileId}?${params.toString()}`,
      {},
      'POST',
      options
    )
  }

  // Get supported formats and languages
  async getSupportedFormats(): Promise<SupportedFormatsResponse> {
    return this.makeRequest<SupportedFormatsResponse>(
      API_CONFIG.ENDPOINTS.speech.supportedFormats,
      {},
      'GET',
      { timeout: 10000, retries: 1 }
    )
  }

  // Get list of audio files
  async getAudioFiles(
    page: number = 1,
    pageSize: number = 20
  ): Promise<AudioFileInfo[]> {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('page_size', pageSize.toString())

    return this.makeRequest<AudioFileInfo[]>(
      `${API_CONFIG.ENDPOINTS.speech.audioFiles}?${params.toString()}`,
      {},
      'GET'
    )
  }

  // Utility method to check if audio format is supported
  async isAudioFormatSupported(file: File): Promise<boolean> {
    try {
      const supportedFormats = await this.getSupportedFormats()
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      if (!fileExtension) return false

      return supportedFormats.formats.some(format => 
        format.extension.toLowerCase() === `.${fileExtension}`
      )
    } catch (error) {
      logger.error('Failed to check audio format support:', error)
      return false
    }
  }

  // Utility method to get confidence level description
  getConfidenceDescription(confidence: number): string {
    if (confidence >= 0.9) return 'Very High'
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.7) return 'Medium'
    if (confidence >= 0.6) return 'Low'
    return 'Very Low'
  }

  // Helper method to get auth token (implement based on your auth system)
  private getAuthToken(): string {
    // This should be implemented based on your authentication system
    // For now, return empty string - you'll need to integrate with your auth context
    return ''
  }
}

// Create a singleton instance
export const speechService = new SpeechService()
