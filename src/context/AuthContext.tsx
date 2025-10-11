import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

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
  login: (email: string, password: string, role: UserRole) => Promise<void>
  logout: () => void
  checkAuth: () => void
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

  // Mock authentication - in real app, this would call your API
  const login = useCallback(async (email: string, _password: string, role: UserRole) => {
    setIsLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock user data based on role
      const mockUser: User = {
        id: '1',
        email,
        name: role === 'enterprise' ? 'Enterprise Admin' : 'John Doe',
        role,
        organization: role === 'enterprise' ? 'Acme Corp' : undefined,
        avatar: undefined
      }
      
      setUser(mockUser)
      localStorage.setItem('user', JSON.stringify(mockUser))
    } catch (error) {
      throw new Error('Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('user')
  }, [])

  const checkAuth = useCallback(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (error) {
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
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
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
