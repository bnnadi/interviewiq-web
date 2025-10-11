import { SessionData, SessionSummary } from '@types/session'
import { logger } from './logger'

export interface UserData {
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

export interface ExportData {
  user: UserData
  sessions: SessionSummary[]
  exportDate: string
  version: string
}

export interface DataValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Session data export/import utilities
export const exportSessionData = (session: SessionData): string => {
  const exportData = {
    ...session,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  }
  return JSON.stringify(exportData, null, 2)
}

export const importSessionData = (jsonString: string): { session: SessionData | null; error: string | null } => {
  try {
    const data = JSON.parse(jsonString)
    
    // Validate required fields
    if (!data.id || !data.jobDescription || !data.role || !data.questions) {
      return { session: null, error: 'Invalid session data: missing required fields' }
    }

    // Convert date strings back to Date objects
    const session: SessionData = {
      ...data,
      startTime: new Date(data.startTime),
      lastSaved: new Date(data.lastSaved)
    }

    // Validate the session data
    const validation = validateSessionData(session)
    if (!validation.isValid) {
      return { session: null, error: `Invalid session data: ${validation.errors.join(', ')}` }
    }

    return { session, error: null }
  } catch (error) {
    return { session: null, error: `Failed to parse session data: ${error}` }
  }
}

// User data export/import utilities
export const exportUserData = (userData: UserData): string => {
  const exportData = {
    ...userData,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  }
  return JSON.stringify(exportData, null, 2)
}

export const importUserData = (jsonString: string): { userData: UserData | null; error: string | null } => {
  try {
    const data = JSON.parse(jsonString)
    
    // Validate required fields
    if (!data.id || !data.email || !data.name || !data.role) {
      return { userData: null, error: 'Invalid user data: missing required fields' }
    }

    // Convert date strings back to Date objects
    const userData: UserData = {
      ...data,
      createdAt: new Date(data.createdAt),
      lastLoginAt: new Date(data.lastLoginAt),
      statistics: {
        ...data.statistics,
        lastActivity: new Date(data.statistics.lastActivity)
      }
    }

    // Validate the user data
    const validation = validateUserData(userData)
    if (!validation.isValid) {
      return { userData: null, error: `Invalid user data: ${validation.errors.join(', ')}` }
    }

    return { userData, error: null }
  } catch (error) {
    return { userData: null, error: `Failed to parse user data: ${error}` }
  }
}

// Complete data export (user + sessions)
export const exportAllData = (userData: UserData, sessions: SessionSummary[]): string => {
  const exportData: ExportData = {
    user: userData,
    sessions,
    exportDate: new Date().toISOString(),
    version: '1.0'
  }
  return JSON.stringify(exportData, null, 2)
}

export const importAllData = (jsonString: string): { 
  userData: UserData | null; 
  sessions: SessionSummary[]; 
  error: string | null 
} => {
  try {
    const data = JSON.parse(jsonString)
    
    // Validate required fields
    if (!data.user || !data.sessions || !Array.isArray(data.sessions)) {
      return { userData: null, sessions: [], error: 'Invalid data: missing required fields' }
    }

    // Import user data
    const userResult = importUserData(JSON.stringify(data.user))
    if (userResult.error) {
      return { userData: null, sessions: [], error: `User data error: ${userResult.error}` }
    }

    // Import sessions
    const sessions: SessionSummary[] = []
    for (const sessionData of data.sessions) {
      const sessionResult = importSessionSummary(JSON.stringify(sessionData))
      if (sessionResult.error) {
        logger.warn('Failed to import session:', sessionResult.error)
        continue
      }
      sessions.push(sessionResult.session!)
    }

    return { 
      userData: userResult.userData, 
      sessions, 
      error: null 
    }
  } catch (error) {
    return { userData: null, sessions: [], error: `Failed to parse data: ${error}` }
  }
}

// Session summary import
export const importSessionSummary = (jsonString: string): { 
  session: SessionSummary | null; 
  error: string | null 
} => {
  try {
    const data = JSON.parse(jsonString)
    
    // Validate required fields
    if (!data.id || !data.role || !data.startTime || !data.lastSaved) {
      return { session: null, error: 'Invalid session summary: missing required fields' }
    }

    // Convert date strings back to Date objects
    const session: SessionSummary = {
      ...data,
      startTime: new Date(data.startTime),
      lastSaved: new Date(data.lastSaved)
    }

    return { session, error: null }
  } catch (error) {
    return { session: null, error: `Failed to parse session summary: ${error}` }
  }
}

// Data validation utilities
export const validateSessionData = (session: SessionData): DataValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields
  if (!session.id) errors.push('Session ID is required')
  if (!session.jobDescription) errors.push('Job description is required')
  if (!session.role) errors.push('Role is required')
  if (!session.questions || !Array.isArray(session.questions)) {
    errors.push('Questions array is required')
  }
  if (!session.startTime) errors.push('Start time is required')
  if (!session.lastSaved) errors.push('Last saved time is required')
  if (!session.status) errors.push('Status is required')

  // Data type validations
  if (session.startTime && !(session.startTime instanceof Date)) {
    errors.push('Start time must be a valid date')
  }
  if (session.lastSaved && !(session.lastSaved instanceof Date)) {
    errors.push('Last saved time must be a valid date')
  }
  if (session.currentQuestionIndex !== undefined && 
      (typeof session.currentQuestionIndex !== 'number' || session.currentQuestionIndex < 0)) {
    errors.push('Current question index must be a non-negative number')
  }

  // Status validation
  if (session.status && !['in_progress', 'completed', 'abandoned'].includes(session.status)) {
    errors.push('Status must be one of: in_progress, completed, abandoned')
  }

  // Date validations
  if (session.startTime && session.lastSaved && session.startTime > session.lastSaved) {
    warnings.push('Start time is after last saved time')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export const validateUserData = (userData: UserData): DataValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields
  if (!userData.id) errors.push('User ID is required')
  if (!userData.email) errors.push('Email is required')
  if (!userData.name) errors.push('Name is required')
  if (!userData.role) errors.push('Role is required')

  // Email validation
  if (userData.email && !isValidEmail(userData.email)) {
    errors.push('Email format is invalid')
  }

  // Role validation
  if (userData.role && !['user', 'enterprise'].includes(userData.role)) {
    errors.push('Role must be either "user" or "enterprise"')
  }

  // Date validations
  if (userData.createdAt && !(userData.createdAt instanceof Date)) {
    errors.push('Created at must be a valid date')
  }
  if (userData.lastLoginAt && !(userData.lastLoginAt instanceof Date)) {
    errors.push('Last login at must be a valid date')
  }

  // Statistics validation
  if (userData.statistics) {
    const stats = userData.statistics
    if (typeof stats.totalSessions !== 'number' || stats.totalSessions < 0) {
      errors.push('Total sessions must be a non-negative number')
    }
    if (typeof stats.averageScore !== 'number' || stats.averageScore < 0 || stats.averageScore > 10) {
      errors.push('Average score must be a number between 0 and 10')
    }
    if (typeof stats.improvementRate !== 'number' || stats.improvementRate < 0) {
      errors.push('Improvement rate must be a non-negative number')
    }
    if (typeof stats.currentStreak !== 'number' || stats.currentStreak < 0) {
      errors.push('Current streak must be a non-negative number')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Utility functions
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const calculateDataSize = (data: any): number => {
  try {
    return JSON.stringify(data).length
  } catch (error) {
    logger.error('Failed to calculate data size:', error)
    return 0
  }
}

export const formatDataSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export const generateDataChecksum = (data: any): string => {
  try {
    const jsonString = JSON.stringify(data, Object.keys(data).sort())
    let hash = 0
    for (let i = 0; i < jsonString.length; i++) {
      const char = jsonString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(36)
  } catch (error) {
    logger.error('Failed to generate data checksum:', error)
    return ''
  }
}

export const compareDataVersions = (local: any, remote: any): {
  hasChanges: boolean
  conflicts: string[]
  localNewer: boolean
} => {
  const localChecksum = generateDataChecksum(local)
  const remoteChecksum = generateDataChecksum(remote)
  
  const hasChanges = localChecksum !== remoteChecksum
  const conflicts: string[] = []
  
  // Simple comparison - in a real implementation, this would be more sophisticated
  if (hasChanges) {
    if (local.lastModified && remote.lastModified) {
      const localTime = new Date(local.lastModified).getTime()
      const remoteTime = new Date(remote.lastModified).getTime()
      return {
        hasChanges: true,
        conflicts: localTime > remoteTime ? ['local_newer'] : ['remote_newer'],
        localNewer: localTime > remoteTime
      }
    }
  }
  
  return {
    hasChanges,
    conflicts,
    localNewer: false
  }
}

// Storage quota utilities
export const getStorageQuotaInfo = async (): Promise<{
  quota: number
  usage: number
  available: number
  percentage: number
}> => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const quota = estimate.quota || 0
      const usage = estimate.usage || 0
      const available = quota - usage
      const percentage = quota > 0 ? (usage / quota) * 100 : 0
      
      return { quota, usage, available, percentage }
    }
    
    // Fallback for browsers that don't support storage quota API
    return { quota: 0, usage: 0, available: 0, percentage: 0 }
  } catch (error) {
    logger.error('Failed to get storage quota info:', error)
    return { quota: 0, usage: 0, available: 0, percentage: 0 }
  }
}

export const isStorageQuotaExceeded = async (additionalBytes: number = 0): Promise<boolean> => {
  try {
    const quotaInfo = await getStorageQuotaInfo()
    return quotaInfo.available < additionalBytes
  } catch (error) {
    logger.error('Failed to check storage quota:', error)
    return false
  }
}
