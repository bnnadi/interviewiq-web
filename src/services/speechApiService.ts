import { API_CONFIG } from '../config/api'
import { logger } from '../utils/logger'
import { networkManager } from '../utils/networkUtils'
import { authService } from './authService'

export interface SpeechTranscriptionRequest {
  audio: File | Blob
  language?: string
  model?: string
  format?: string
  realTime?: boolean
}

export interface SpeechTranscriptionResponse {
  transcript: string
  confidence: number
  language: string
  duration: number
  segments?: TranscriptionSegment[]
  isFinal: boolean
  timestamp: number
}

export interface TranscriptionSegment {
  text: string
  startTime: number
  endTime: number
  confidence: number
}

export interface RealTimeTranscriptionEvent {
  type: 'partial' | 'final' | 'error'
  data: SpeechTranscriptionResponse
}

export interface SpeechApiError extends Error {
  status?: number
  code?: string
  retryable: boolean
  userMessage: string
}

export class SpeechApiService {
  private baseURL: string
  private defaultTimeout: number = 30000 // 30 seconds

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  /**
   * Transcribe audio file using backend speech-to-text API
   */
  async transcribeAudio(request: SpeechTranscriptionRequest): Promise<SpeechTranscriptionResponse> {
    try {
      logger.info('Starting audio transcription', { 
        language: request.language,
        format: request.format,
        realTime: request.realTime 
      })

      // Check network status
      if (!networkManager.isOnline()) {
        throw this.createSpeechError(
          'No internet connection available',
          new Error('Offline'),
          undefined,
          true
        )
      }

      const formData = new FormData()
      formData.append('audio', request.audio)
      
      if (request.language) {
        formData.append('language', request.language)
      }
      if (request.model) {
        formData.append('model', request.model)
      }
      if (request.format) {
        formData.append('format', request.format)
      }
      if (request.realTime !== undefined) {
        formData.append('realTime', request.realTime.toString())
      }

      const response = await this.makeRequest('/api/speech/transcribe', formData, 'POST', {
        timeout: 60000, // 60 seconds for transcription
        requireAuth: true
      })

      logger.info('Audio transcription completed', { 
        confidence: (response as any).confidence,
        duration: (response as any).duration 
      })

      return response as SpeechTranscriptionResponse
    } catch (error) {
      logger.error('Audio transcription failed:', error)
      throw this.handleTranscriptionError(error)
    }
  }

  /**
   * Start real-time transcription stream
   */
  async startRealTimeTranscription(
    request: SpeechTranscriptionRequest,
    onTranscription: (event: RealTimeTranscriptionEvent) => void
  ): Promise<WebSocket> {
    try {
      logger.info('Starting real-time transcription stream')

      // Check network status
      if (!networkManager.isOnline()) {
        throw this.createSpeechError(
          'No internet connection available',
          new Error('Offline'),
          undefined,
          true
        )
      }

      const authHeader = authService.getAuthHeader()
      if (!authHeader) {
        throw this.createSpeechError(
          'Authentication required for real-time transcription',
          new Error('Unauthorized'),
          401,
          false
        )
      }

      // Create WebSocket connection for real-time transcription
      const wsUrl = this.baseURL.replace('http', 'ws') + '/api/speech/transcribe/stream'
      const ws = new WebSocket(wsUrl, ['authorization', authHeader])

      ws.onopen = () => {
        logger.info('Real-time transcription WebSocket connected')
        
        // Send initial configuration
        ws.send(JSON.stringify({
          language: request.language || 'en-US',
          model: request.model || 'default',
          format: request.format || 'webm'
        }))
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onTranscription({
            type: data.type || 'partial',
            data: data
          })
        } catch (error) {
          logger.error('Failed to parse WebSocket message:', error)
          onTranscription({
            type: 'error',
            data: {
              transcript: '',
              confidence: 0,
              language: request.language || 'en-US',
              duration: 0,
              isFinal: false,
              timestamp: Date.now()
            }
          })
        }
      }

      ws.onerror = (error) => {
        logger.error('Real-time transcription WebSocket error:', error)
        onTranscription({
          type: 'error',
          data: {
            transcript: '',
            confidence: 0,
            language: request.language || 'en-US',
            duration: 0,
            isFinal: false,
            timestamp: Date.now()
          }
        })
      }

      ws.onclose = (event) => {
        logger.info('Real-time transcription WebSocket closed', { 
          code: event.code, 
          reason: event.reason 
        })
      }

      return ws
    } catch (error) {
      logger.error('Failed to start real-time transcription:', error)
      throw this.handleTranscriptionError(error)
    }
  }

  /**
   * Send audio chunk for real-time transcription
   */
  async sendAudioChunk(ws: WebSocket, audioChunk: Blob): Promise<void> {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(audioChunk)
      } else {
        throw this.createSpeechError(
          'WebSocket connection is not open',
          new Error('Connection closed'),
          undefined,
          true
        )
      }
    } catch (error) {
      logger.error('Failed to send audio chunk:', error)
      throw this.handleTranscriptionError(error)
    }
  }

  /**
   * Stop real-time transcription
   */
  async stopRealTimeTranscription(ws: WebSocket): Promise<void> {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stop' }))
        ws.close(1000, 'Transcription completed')
      }
    } catch (error) {
      logger.error('Failed to stop real-time transcription:', error)
      throw this.handleTranscriptionError(error)
    }
  }

  /**
   * Upload audio file for transcription
   */
  async uploadAudioFile(file: File, language?: string): Promise<SpeechTranscriptionResponse> {
    try {
      logger.info('Uploading audio file for transcription', { 
        fileName: file.name,
        fileSize: file.size,
        language 
      })

      return await this.transcribeAudio({
        audio: file,
        language: language || 'en-US',
        format: file.type,
        realTime: false
      })
    } catch (error) {
      logger.error('Audio file upload failed:', error)
      throw this.handleTranscriptionError(error)
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<string[]> {
    try {
      const response = await this.makeRequest('/api/speech/languages', {}, 'GET', {
        requireAuth: true
      })
      return (response as any).languages || ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE']
    } catch (error) {
      logger.warn('Failed to get supported languages, using defaults:', error)
      return ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE']
    }
  }

  /**
   * Get supported audio formats
   */
  async getSupportedFormats(): Promise<string[]> {
    try {
      const response = await this.makeRequest('/api/speech/formats', {}, 'GET', {
        requireAuth: true
      })
      return (response as any).formats || ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a']
    } catch (error) {
      logger.warn('Failed to get supported formats, using defaults:', error)
      return ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a']
    }
  }

  /**
   * Make HTTP request to backend
   */
  private async makeRequest<T>(
    endpoint: string,
    data: FormData | Record<string, any>,
    method: 'GET' | 'POST' = 'POST',
    options: {
      timeout?: number
      requireAuth?: boolean
    } = {}
  ): Promise<T> {
    const { timeout = this.defaultTimeout, requireAuth = true } = options

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const headers: Record<string, string> = {}

      if (requireAuth) {
        const authHeader = authService.getAuthHeader()
        if (authHeader) {
          headers['Authorization'] = authHeader
        }
      }

      // Don't set Content-Type for FormData - let browser set it with boundary
      if (!(data instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
      }

      const requestOptions: RequestInit = {
        method,
        headers,
        signal: controller.signal
      }

      if (method !== 'GET' && data) {
        if (data instanceof FormData) {
          requestOptions.body = data
        } else {
          requestOptions.body = JSON.stringify(data)
        }
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, requestOptions)
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw this.createSpeechError(
          `HTTP ${response.status}: ${errorText || response.statusText}`,
          new Error(errorText || response.statusText),
          response.status,
          response.status >= 500 || response.status === 429
        )
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createSpeechError(
          'Request timeout - please try again',
          error,
          undefined,
          true
        )
      }
      
      throw this.handleTranscriptionError(error)
    }
  }

  /**
   * Create speech API error
   */
  private createSpeechError(
    message: string,
    originalError: Error,
    status?: number,
    retryable: boolean = false
  ): SpeechApiError {
    const error = new Error(message) as SpeechApiError
    if (status !== undefined) {
      error.status = status
    }
    error.retryable = retryable
    error.userMessage = this.getUserFriendlyMessage(message, status)
    if (originalError.stack) {
      error.stack = originalError.stack
    }
    return error
  }

  /**
   * Handle transcription errors
   */
  private handleTranscriptionError(error: any): SpeechApiError {
    if (error instanceof Error && 'userMessage' in error) {
      return error as SpeechApiError
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    const status = error?.status || error?.response?.status

    return this.createSpeechError(
      `Transcription failed: ${message}`,
      error instanceof Error ? error : new Error(message),
      status,
      this.isRetryableError(error)
    )
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (error?.status) {
      return error.status >= 500 || error.status === 429
    }
    
    if (error instanceof Error) {
      return error.name === 'AbortError' || 
             error.message.includes('timeout') ||
             error.message.includes('network')
    }
    
    return false
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(message: string, status?: number): string {
    if (status === 401) {
      return 'Please log in to use speech recognition features.'
    }
    
    if (status === 403) {
      return 'You don\'t have permission to use speech recognition.'
    }
    
    if (status === 413) {
      return 'Audio file is too large. Please choose a smaller file.'
    }
    
    if (status === 415) {
      return 'Audio format not supported. Please use a different file format.'
    }
    
    if (status === 429) {
      return 'Too many requests. Please wait a moment and try again.'
    }
    
    if (status && status >= 500) {
      return 'Speech recognition service is temporarily unavailable. Please try again later.'
    }
    
    if (message.includes('timeout')) {
      return 'Request timed out. Please try again.'
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.'
    }
    
    return 'Speech recognition failed. Please try again.'
  }
}

// Create singleton instance
export const speechApiService = new SpeechApiService()