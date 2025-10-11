import { API_CONFIG } from '../config/api'
import { logger } from '../utils/logger'
import { networkManager } from '../utils/networkUtils'
import { SessionData, SessionSummary } from '../types/session'

interface UserData {
  id: string
  email: string
  name: string
  role: 'user' | 'enterprise'
  createdAt: Date
  lastLoginAt: Date
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    notifications: boolean
    autoSave: boolean
    language: string
  }
  statistics: {
    totalSessions: number
    averageScore: number
    improvementRate: number
    currentStreak: number
    lastActivity: Date
  }
}

interface SyncResponse {
  success: boolean
  syncedAt: Date
  conflicts: Array<{
    type: 'user' | 'session'
    id: string
    localVersion: string
    remoteVersion: string
    resolution: 'local' | 'remote' | 'merge'
  }>
  statistics: {
    userDataUpdated: boolean
    sessionsSynced: number
    sessionsCreated: number
    sessionsUpdated: number
  }
}

interface DataServiceError extends Error {
  status?: number
  code?: string
  retryable: boolean
  userMessage: string
}

export class DataService {
  private baseURL: string
  private defaultTimeout: number = 30000 // 30 seconds

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  private createError(
    message: string,
    originalError: Error,
    status?: number,
    retryable: boolean = true
  ): DataServiceError {
    const error = new Error(message) as DataServiceError
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
        case 409:
          return 'There was a conflict with the server data. Please try syncing again.'
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
    options: {
      timeout?: number
      retries?: number
      retryDelay?: number
    } = {}
  ): Promise<T> {
    const { timeout = this.defaultTimeout, retries = 3, retryDelay = 1000 } = options

    // Check network status before making request
    if (!networkManager.isOnline()) {
      throw this.createError(
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

        const response = await fetch(`${this.baseURL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          lastError = this.createError(
            `HTTP ${response.status}: ${errorText || response.statusText}`,
            new Error(errorText || response.statusText),
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
          lastError = this.createError(
            'Request timeout',
            lastError,
            undefined,
            true
          )
        }

        // Handle network errors
        if (lastError.name === 'TypeError' && lastError.message.includes('fetch')) {
          lastError = this.createError(
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
        logger.warn(`Data service request failed (attempt ${attempt + 1}/${retries + 1}):`, lastError)

        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Request failed after all retries')
  }

  // Get user data from backend
  async getUserData(userId: string): Promise<UserData> {
    try {
      logger.info('Fetching user data from backend:', userId)
      
      // For now, return mock data since we don't have a real backend
      // In a real implementation, this would make an API call
      const mockUserData: UserData = {
        id: userId,
        email: 'user@example.com',
        name: 'John Doe',
        role: 'user',
        createdAt: new Date('2024-01-01'),
        lastLoginAt: new Date(),
        preferences: {
          theme: 'auto',
          notifications: true,
          autoSave: true,
          language: 'en'
        },
        statistics: {
          totalSessions: 0,
          averageScore: 0,
          improvementRate: 0,
          currentStreak: 0,
          lastActivity: new Date()
        }
      }

      logger.info('User data fetched successfully')
      return mockUserData
    } catch (error) {
      logger.error('Failed to fetch user data:', error)
      throw error
    }
  }

  // Update user data on backend
  async updateUserData(userId: string, updates: Partial<UserData>): Promise<UserData> {
    try {
      logger.info('Updating user data on backend:', { userId, updates })
      
      // For now, return mock data since we don't have a real backend
      // In a real implementation, this would make an API call
      const currentData = await this.getUserData(userId)
      const updatedData = { ...currentData, ...updates }
      
      logger.info('User data updated successfully')
      return updatedData
    } catch (error) {
      logger.error('Failed to update user data:', error)
      throw error
    }
  }

  // Sync user data with backend
  async syncUserData(): Promise<void> {
    try {
      logger.info('Syncing user data with backend')
      
      // For now, just log since we don't have a real backend
      // In a real implementation, this would sync user preferences and statistics
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      logger.info('User data synced successfully')
    } catch (error) {
      logger.error('Failed to sync user data:', error)
      throw error
    }
  }

  // Sync session data with backend
  async syncSessionData(): Promise<void> {
    try {
      logger.info('Syncing session data with backend')
      
      // For now, just log since we don't have a real backend
      // In a real implementation, this would sync session history and analytics
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call
      
      logger.info('Session data synced successfully')
    } catch (error) {
      logger.error('Failed to sync session data:', error)
      throw error
    }
  }

  // Full data synchronization
  async syncAllData(): Promise<SyncResponse> {
    try {
      logger.info('Starting full data synchronization')
      
      // For now, return mock response since we don't have a real backend
      // In a real implementation, this would perform comprehensive sync
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      const response: SyncResponse = {
        success: true,
        syncedAt: new Date(),
        conflicts: [],
        statistics: {
          userDataUpdated: false,
          sessionsSynced: 0,
          sessionsCreated: 0,
          sessionsUpdated: 0
        }
      }
      
      logger.info('Full data synchronization completed')
      return response
    } catch (error) {
      logger.error('Failed to sync all data:', error)
      throw error
    }
  }

  // Upload session data to backend
  async uploadSession(session: SessionData): Promise<void> {
    try {
      logger.info('Uploading session to backend:', session.id)
      
      // For now, just log since we don't have a real backend
      // In a real implementation, this would upload session data
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
      
      logger.info('Session uploaded successfully')
    } catch (error) {
      logger.error('Failed to upload session:', error)
      throw error
    }
  }

  // Download session data from backend
  async downloadSessions(userId: string): Promise<SessionSummary[]> {
    try {
      logger.info('Downloading sessions from backend:', userId)
      
      // For now, return empty array since we don't have a real backend
      // In a real implementation, this would download session history
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      logger.info('Sessions downloaded successfully')
      return []
    } catch (error) {
      logger.error('Failed to download sessions:', error)
      throw error
    }
  }

  // Health check for data service
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      // For now, return mock response since we don't have a real backend
      // In a real implementation, this would check backend connectivity
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate API call
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Data service health check failed:', error)
      throw error
    }
  }
}

// Create a singleton instance
export const dataService = new DataService()
