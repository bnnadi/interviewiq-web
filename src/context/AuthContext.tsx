import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authService, LoginRequest } from '../services/authService'

export type UserRole = 'user' | 'enterprise' | null

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  organization?: string | undefined
  avatar?: string | undefined
}

interface AuthContextType {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Actions
  login: (email: string, password: string, role: UserRole, organization?: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // Real JWT authentication implementation
  const login = useCallback(async (email: string, password: string, role: UserRole, organization?: string) => {
    setIsLoading(true)
    
    try {
      const loginData: LoginRequest = {
        email,
        password,
        role: role!,
        ...(organization && { organization })
      }
      
      const response = await authService.login(loginData)
      setUser(response.user)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please check your credentials.'
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsLoading(false)
    }
  }, [])

  const checkAuth = useCallback(async () => {
    setIsLoading(true)
    
    try {
      // Check if we have valid tokens
      if (!authService.isAuthenticated()) {
        setUser(null)
        return
      }

      // Try to get current user from API
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshAuth = useCallback(async () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        }
      }
    } catch (error) {
      console.error('Auth refresh failed:', error)
      setUser(null)
    }
  }, [])

  // Check authentication on mount
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
    refreshAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
