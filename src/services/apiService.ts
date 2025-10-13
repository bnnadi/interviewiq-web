import { API_CONFIG } from '../config/api'
import { logger } from '../utils/logger'
import { networkManager } from '../utils/networkUtils'
import { authService } from './authService'

interface ParseJobDescriptionRequest {
  role: string
  jobDescription: string
}

interface AnalyzeAnswerRequest {
  jobDescription: string
  question: string
  answer: string
}

export interface ApiError extends Error {
  status?: number
  code?: string
  retryable: boolean
  userMessage: string
}

export class ApiService {
  private baseURL: string
  private defaultTimeout: number = 30000 // 30 seconds

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  private createApiError(
    message: string,
    originalError: Error,
    status: number | undefined = undefined,
    retryable: boolean = true
  ): ApiError {
    const error = new Error(message) as ApiError
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
      return 'The request is taking longer than expected. Please try again.'
    }

    // HTTP status codes
    if (status) {
      switch (status) {
        case 400:
          return 'There was an issue with your request. Please check your input and try again.'
        case 401:
          return 'You need to be logged in to perform this action.'
        case 403:
          return 'You don\'t have permission to perform this action.'
        case 404:
          return 'The requested resource was not found.'
        case 408:
          return 'The request timed out. Please try again.'
        case 429:
          return 'Too many requests. Please wait a moment and try again.'
        case 500:
          return 'Our servers are experiencing issues. Please try again in a few moments.'
        case 502:
        case 503:
        case 504:
          return 'The service is temporarily unavailable. Please try again later.'
        default:
          return `Server error (${status}). Please try again.`
      }
    }

    return 'An unexpected error occurred. Please try again.'
  }

  private async makeRequest<T>(
    endpoint: string,
    data: unknown,
    _operation: string,
    options: {
      timeout?: number
      retries?: number
      retryDelay?: number
      requireAuth?: boolean
    } = {}
  ): Promise<T> {
    const { timeout = this.defaultTimeout, retries = 3, retryDelay = 1000, requireAuth = true } = options
    
    // Check network status before making request
    if (!networkManager.isOnline()) {
      throw this.createApiError(
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

        // Prepare headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }

        // Add authorization header if required
        if (requireAuth) {
          const authHeader = authService.getAuthHeader()
          if (authHeader) {
            headers['Authorization'] = authHeader
          }
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          
          // Handle 401 Unauthorized - try to refresh token
          if (response.status === 401 && requireAuth && attempt === 0) {
            try {
              await authService.refreshAccessToken()
              // Retry the request with new token
              continue
            } catch (refreshError) {
              // Refresh failed, user needs to login again
              lastError = this.createApiError(
                'Session expired. Please log in again.',
                new Error('Authentication failed'),
                401,
                false
              )
              throw lastError
            }
          }

          lastError = this.createApiError(
            `HTTP ${response.status}: ${errorText || response.statusText}`,
            new Error(errorText || response.statusText),
            response.status,
            response.status >= 500 || response.status === 429 // Retry on server errors and rate limits
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
          lastError = this.createApiError(
            'Request timeout',
            lastError,
            undefined,
            true
          )
        }
        
        // Handle network errors
        if (lastError.name === 'TypeError' && lastError.message.includes('fetch')) {
          lastError = this.createApiError(
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
        logger.warn(`API request failed (attempt ${attempt + 1}/${retries + 1}):`, lastError)
        
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Request failed after all retries')
  }

  async parseJobDescription(
    role: string, 
    jobDescription: string,
    options?: { timeout?: number; retries?: number }
  ): Promise<{ questions: string[] }> {
    return this.makeRequest<{ questions: string[] }>(
      API_CONFIG.ENDPOINTS.parseJD, 
      { role, jobDescription } as ParseJobDescriptionRequest, 
      'parse job description',
      options
    )
  }

  async analyzeAnswer(
    jobDescription: string, 
    question: string, 
    answer: string,
    options?: { timeout?: number; retries?: number }
  ): Promise<unknown> {
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.analyzeAnswer, 
      { jobDescription, question, answer } as AnalyzeAnswerRequest, 
      'analyze answer',
      options
    )
  }

  // Health check method for testing connectivity
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest<{ status: string; timestamp: string }>(
      '/health',
      {},
      'health check',
      { timeout: 5000, retries: 1 }
    )
  }
}

// Create a singleton instance
export const apiService = new ApiService()
