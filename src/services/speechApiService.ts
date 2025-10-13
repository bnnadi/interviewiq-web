import { API_CONFIG } from '../config/api'
import { logger } from '../utils/logger'
import { networkManager } from '../utils/networkUtils'

export interface SpeechTranscriptionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  alternatives?: Array<{
    transcript: string
    confidence: number
  }>
  timestamp: number
}

export interface SpeechAnalysisResult {
  fillerWords: string[]
  speakingRate: number // words per minute
  confidence: number
  clarity: number
  tone: 'positive' | 'neutral' | 'negative'
}

export interface SpeechApiError extends Error {
  status?: number
  code?: string
  retryable: boolean
  userMessage: string
}

export class SpeechApiService {
  private baseURL: string
  private wsConnection: WebSocket | null = null
  private wsReconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  private createError(
    message: string,
    originalError: Error,
    status?: number,
    retryable: boolean = true
  ): SpeechApiError {
    const error = new Error(message) as SpeechApiError
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
      return 'Unable to connect to the speech service. Please check your internet connection and try again.'
    }

    // WebSocket errors
    if (error.message.includes('WebSocket')) {
      return 'Real-time transcription is temporarily unavailable. Using standard transcription instead.'
    }

    // Timeout errors
    if (error.message.includes('timeout')) {
      return 'Speech processing is taking longer than expected. Please try again.'
    }

    // HTTP status codes
    if (status) {
      switch (status) {
        case 400:
          return 'Invalid audio format. Please ensure your microphone is working properly.'
        case 401:
          return 'Authentication required for speech processing.'
        case 403:
          return 'Speech processing quota exceeded. Please try again later.'
        case 413:
          return 'Audio file too large. Please record a shorter segment.'
        case 429:
          return 'Too many speech requests. Please wait a moment and try again.'
        case 500:
          return 'Speech processing service is temporarily unavailable.'
        case 502:
        case 503:
        case 504:
          return 'Speech service is temporarily unavailable. Please try again later.'
        default:
          return `Speech processing error (${status}). Please try again.`
      }
    }

    return 'Speech processing failed. Please try again.'
  }

  // WebSocket connection for real-time transcription
  async connectWebSocket(
    onTranscription: (result: SpeechTranscriptionResult) => void,
    onError: (error: SpeechApiError) => void,
    onConnectionChange: (connected: boolean) => void
  ): Promise<void> {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      logger.info('WebSocket already connected')
      return
    }

    if (this.isConnecting) {
      logger.info('WebSocket connection already in progress')
      return
    }

    this.isConnecting = true

    try {
      const wsUrl = this.baseURL.replace('http', 'ws') + API_CONFIG.ENDPOINTS.speech.transcribe
      this.wsConnection = new WebSocket(wsUrl)

      this.wsConnection.onopen = () => {
        logger.info('WebSocket connected for real-time transcription')
        this.wsReconnectAttempts = 0
        this.isConnecting = false
        onConnectionChange(true)
      }

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const result: SpeechTranscriptionResult = {
            transcript: data.transcript || '',
            confidence: data.confidence || 0,
            isFinal: data.is_final || false,
            alternatives: data.alternatives || [],
            timestamp: Date.now()
          }
          onTranscription(result)
        } catch (error) {
          logger.error('Failed to parse WebSocket message:', error)
          onError(this.createError('Invalid response from speech service', error as Error))
        }
      }

      this.wsConnection.onclose = (event) => {
        logger.warn('WebSocket disconnected:', event.code, event.reason)
        this.isConnecting = false
        onConnectionChange(false)
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && this.wsReconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(onTranscription, onError, onConnectionChange)
        }
      }

      this.wsConnection.onerror = (error) => {
        logger.error('WebSocket error:', error)
        this.isConnecting = false
        onError(this.createError('WebSocket connection failed', new Error('WebSocket error')))
      }

    } catch (error) {
      this.isConnecting = false
      onError(this.createError('Failed to connect to speech service', error as Error))
    }
  }

  private attemptReconnect(
    onTranscription: (result: SpeechTranscriptionResult) => void,
    onError: (error: SpeechApiError) => void,
    onConnectionChange: (connected: boolean) => void
  ): void {
    this.wsReconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.wsReconnectAttempts - 1)
    
    logger.info(`Attempting to reconnect WebSocket in ${delay}ms (attempt ${this.wsReconnectAttempts})`)
    
    setTimeout(() => {
      this.connectWebSocket(onTranscription, onError, onConnectionChange)
    }, delay)
  }

  // Send audio data to WebSocket
  sendAudioData(audioData: ArrayBuffer): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(audioData)
    } else {
      logger.warn('WebSocket not connected, cannot send audio data')
    }
  }

  // Close WebSocket connection
  disconnectWebSocket(): void {
    if (this.wsConnection) {
      this.wsConnection.close(1000, 'Normal closure')
      this.wsConnection = null
      this.wsReconnectAttempts = 0
    }
  }

  // REST API for batch transcription
  async transcribeAudio(
    audioBlob: Blob,
    options: {
      language?: string
      sampleRate?: number
      format?: string
      enableAnalysis?: boolean
    } = {}
  ): Promise<{
    transcription: SpeechTranscriptionResult
    analysis?: SpeechAnalysisResult
  }> {
    const { language = 'en-US', sampleRate = 44100, format = 'webm', enableAnalysis = true } = options

    // Check network status
    if (!networkManager.isOnline()) {
      throw this.createError(
        'No internet connection available',
        new Error('Offline'),
        undefined,
        true
      )
    }

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, `recording.${format}`)
      formData.append('language', language)
      formData.append('sample_rate', sampleRate.toString())
      formData.append('enable_analysis', enableAnalysis.toString())

      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.speech.transcribe}`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type, let browser set it with boundary
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw this.createError(
          `HTTP ${response.status}: ${errorText || response.statusText}`,
          new Error(errorText || response.statusText),
          response.status,
          response.status >= 500 || response.status === 429
        )
      }

      const data = await response.json()
      
      const transcription: SpeechTranscriptionResult = {
        transcript: data.transcript || '',
        confidence: data.confidence || 0,
        isFinal: true,
        alternatives: data.alternatives || [],
        timestamp: Date.now()
      }

      const analysis: SpeechAnalysisResult | undefined = data.analysis ? {
        fillerWords: data.analysis.filler_words || [],
        speakingRate: data.analysis.speaking_rate || 0,
        confidence: data.analysis.confidence || 0,
        clarity: data.analysis.clarity || 0,
        tone: data.analysis.tone || 'neutral'
      } : undefined

      logger.info('Audio transcription completed successfully')
      return { transcription, analysis }

    } catch (error) {
      logger.error('Audio transcription failed:', error)
      throw error instanceof SpeechApiError ? error : this.createError(
        'Failed to transcribe audio',
        error as Error
      )
    }
  }

  // Upload audio file for processing
  async uploadAudioFile(
    file: File,
    options: {
      language?: string
      enableAnalysis?: boolean
    } = {}
  ): Promise<{
    transcription: SpeechTranscriptionResult
    analysis?: SpeechAnalysisResult
  }> {
    const { language = 'en-US', enableAnalysis = true } = options

    // Validate file type
    const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a']
    if (!allowedTypes.includes(file.type)) {
      throw this.createError(
        'Unsupported audio format',
        new Error(`File type ${file.type} not supported`),
        400,
        false
      )
    }

    // Validate file size (max 25MB)
    const maxSize = 25 * 1024 * 1024
    if (file.size > maxSize) {
      throw this.createError(
        'Audio file too large',
        new Error(`File size ${file.size} exceeds limit`),
        413,
        false
      )
    }

    return this.transcribeAudio(file, { language, enableAnalysis })
  }

  // Health check for speech service
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.speech.transcribe}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw this.createError(
          `Health check failed: ${response.status}`,
          new Error(`HTTP ${response.status}`),
          response.status
        )
      }

      const data = await response.json()
      return {
        status: data.status || 'unknown',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Speech service health check failed:', error)
      throw error instanceof SpeechApiError ? error : this.createError(
        'Speech service health check failed',
        error as Error
      )
    }
  }

  // Get connection status
  getConnectionStatus(): {
    connected: boolean
    connecting: boolean
    reconnectAttempts: number
  } {
    return {
      connected: this.wsConnection?.readyState === WebSocket.OPEN,
      connecting: this.isConnecting,
      reconnectAttempts: this.wsReconnectAttempts
    }
  }
}

// Create a singleton instance
export const speechApiService = new SpeechApiService()
