import { API_CONFIG } from '../config/api'
import { logger } from '../utils/logger'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface LoginRequest {
  email: string
  password: string
  role: 'user' | 'enterprise'
  organization?: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface RefreshResponse {
  accessToken: string
  expiresIn: number
}

export class AuthService {
  private baseURL: string
  private refreshPromise: Promise<string> | null = null

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  /**
   * Login user with email and password
   */
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.auth.login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Login failed: ${response.statusText}`)
      }

      const data: LoginResponse = await response.json()
      
      // Store tokens securely
      this.storeTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000)
      })

      // Decode user info from JWT for logging
      const user = this.decodeJWTUser(data.access_token)
      logger.info('User logged in successfully:', user.email)
      
      return data
    } catch (error) {
      logger.error('Login failed:', error)
      throw error
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this._performTokenRefresh()

    try {
      const newAccessToken = await this.refreshPromise
      return newAccessToken
    } finally {
      this.refreshPromise = null
    }
  }

  private async _performTokenRefresh(): Promise<string> {
    const refreshToken = this.getStoredRefreshToken()
    
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.auth.refresh}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`
        }
      })

      if (!response.ok) {
        // Refresh token is invalid, clear all tokens
        this.clearTokens()
        throw new Error('Refresh token expired or invalid')
      }

      const data: RefreshResponse = await response.json()
      
      // Update stored access token
      this.updateAccessToken(data.accessToken, data.expiresIn)
      
      logger.info('Access token refreshed successfully')
      return data.accessToken
    } catch (error) {
      logger.error('Token refresh failed:', error)
      this.clearTokens()
      throw error
    }
  }

  /**
   * Logout user and clear all tokens
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = this.getStoredRefreshToken()
      
      if (refreshToken) {
        // Call logout endpoint to invalidate refresh token on server
        await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.auth.logout}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`
          }
        }).catch(() => {
          // Ignore errors on logout - we still want to clear local tokens
          logger.warn('Logout API call failed, but clearing local tokens')
        })
      }
    } catch (error) {
      logger.warn('Logout API call failed:', error)
    } finally {
      // Always clear local tokens regardless of API call success
      this.clearTokens()
      logger.info('User logged out successfully')
    }
  }

  /**
   * Get current user info from stored token
   */
  async getCurrentUser(): Promise<{
    id: string
    email: string
    name: string
    role: 'user' | 'enterprise'
    organization?: string
    avatar?: string
  } | null> {
    try {
      const accessToken = this.getStoredAccessToken()
      
      if (!accessToken || this.isTokenExpired()) {
        return null
      }

      // Decode user info from the stored JWT token
      return this.decodeJWTUser(accessToken)
    } catch (error) {
      logger.error('Failed to get current user:', error)
      return null
    }
  }

  /**
   * Store authentication tokens securely
   */
  private storeTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem('access_token', tokens.accessToken)
      localStorage.setItem('refresh_token', tokens.refreshToken)
      localStorage.setItem('token_expires', tokens.expiresAt.toString())
      logger.info('Tokens stored successfully')
    } catch (error) {
      logger.error('Failed to store tokens:', error)
      throw new Error('Failed to store authentication tokens')
    }
  }

  /**
   * Update only the access token (used during refresh)
   */
  private updateAccessToken(accessToken: string, expiresIn: number): void {
    try {
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('token_expires', (Date.now() + (expiresIn * 1000)).toString())
      logger.info('Access token updated successfully')
    } catch (error) {
      logger.error('Failed to update access token:', error)
      throw new Error('Failed to update access token')
    }
  }

  /**
   * Get stored access token
   */
  getStoredAccessToken(): string | null {
    return localStorage.getItem('access_token')
  }

  /**
   * Get stored refresh token
   */
  getStoredRefreshToken(): string | null {
    return localStorage.getItem('refresh_token')
  }

  /**
   * Get stored tokens
   */
  getStoredTokens(): AuthTokens | null {
    const accessToken = this.getStoredAccessToken()
    const refreshToken = this.getStoredRefreshToken()
    const expiresAt = localStorage.getItem('token_expires')

    if (!accessToken || !refreshToken || !expiresAt) {
      return null
    }

    return {
      accessToken,
      refreshToken,
      expiresAt: parseInt(expiresAt, 10)
    }
  }

  /**
   * Check if access token is expired
   */
  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('token_expires')
    if (!expiresAt) {
      return true
    }

    const expirationTime = parseInt(expiresAt, 10)
    const now = Date.now()
    
    // Consider token expired if it expires within the next 5 minutes
    return now >= (expirationTime - 5 * 60 * 1000)
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const tokens = this.getStoredTokens()
    return tokens !== null && !this.isTokenExpired()
  }

  /**
   * Clear all stored tokens
   */
  clearTokens(): void {
    try {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('token_expires')
      logger.info('All tokens cleared')
    } catch (error) {
      logger.error('Failed to clear tokens:', error)
    }
  }

  /**
   * Decode JWT token to extract user information
   */
  decodeJWTUser(token: string): {
    id: string
    email: string
    name: string
    role: 'user' | 'enterprise'
    organization?: string
    avatar?: string
  } {
    try {
      // JWT tokens have 3 parts separated by dots: header.payload.signature
      const parts = token.split('.')
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format')
      }

      // Decode the payload (second part)
      const payload = parts[1]
      if (!payload) {
        throw new Error('Invalid JWT token: missing payload')
      }
      // Add padding if needed for base64 decoding
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4)
      const decodedPayload = atob(paddedPayload)
      const userData = JSON.parse(decodedPayload)

      // Extract user information from JWT payload
      return {
        id: userData.sub || userData.user_id || '',
        email: userData.email || '',
        name: userData.name || userData.email?.split('@')[0] || 'User',
        role: userData.role || 'user',
        organization: userData.organization,
        avatar: userData.avatar
      }
    } catch (error) {
      logger.error('Failed to decode JWT token:', error)
      // Return a fallback user object
      return {
        id: 'unknown',
        email: 'unknown@example.com',
        name: 'User',
        role: 'user'
      }
    }
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader(): string | null {
    const accessToken = this.getStoredAccessToken()
    return accessToken ? `Bearer ${accessToken}` : null
  }
}

// Create singleton instance
export const authService = new AuthService()
