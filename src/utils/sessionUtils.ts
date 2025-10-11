import { SessionData, SessionSummary } from '../types/session'

// Session data validation
export const validateSessionData = (session: Partial<SessionData>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (!session.id) {
    errors.push('Session ID is required')
  }

  if (!session.jobDescription || session.jobDescription.trim().length === 0) {
    errors.push('Job description is required')
  }

  if (!session.role || session.role.trim().length === 0) {
    errors.push('Role is required')
  }

  if (!session.questions || !Array.isArray(session.questions) || session.questions.length === 0) {
    errors.push('Questions array is required and must not be empty')
  }

  if (session.currentQuestionIndex === undefined || session.currentQuestionIndex < 0) {
    errors.push('Current question index must be a non-negative number')
  }

  if (session.questions && session.currentQuestionIndex !== undefined && 
      session.currentQuestionIndex >= session.questions.length) {
    errors.push('Current question index cannot exceed questions array length')
  }

  if (!session.startTime || !(session.startTime instanceof Date)) {
    errors.push('Start time must be a valid Date object')
  }

  if (!session.lastSaved || !(session.lastSaved instanceof Date)) {
    errors.push('Last saved time must be a valid Date object')
  }

  if (!session.status || !['in_progress', 'completed', 'abandoned'].includes(session.status)) {
    errors.push('Status must be one of: in_progress, completed, abandoned')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Session progress calculation
export const calculateSessionProgress = (session: SessionData): {
  questionsAnswered: number
  totalQuestions: number
  progressPercentage: number
  isComplete: boolean
} => {
  const questionsAnswered = session.currentQuestionIndex
  const totalQuestions = session.questions.length
  const progressPercentage = totalQuestions > 0 ? Math.round((questionsAnswered / totalQuestions) * 100) : 0
  const isComplete = questionsAnswered >= totalQuestions

  return {
    questionsAnswered,
    totalQuestions,
    progressPercentage,
    isComplete
  }
}

// Session duration calculation
export const calculateSessionDuration = (session: SessionData): {
  totalDuration: number // in milliseconds
  totalDurationFormatted: string
  timeSinceLastSaved: number // in milliseconds
  timeSinceLastSavedFormatted: string
} => {
  const now = new Date()
  const totalDuration = now.getTime() - session.startTime.getTime()
  const timeSinceLastSaved = now.getTime() - session.lastSaved.getTime()

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  return {
    totalDuration,
    totalDurationFormatted: formatDuration(totalDuration),
    timeSinceLastSaved,
    timeSinceLastSavedFormatted: formatDuration(timeSinceLastSaved)
  }
}

// Session summary creation
export const createSessionSummary = (session: SessionData): SessionSummary => {
  const progress = calculateSessionProgress(session)

  return {
    id: session.id,
    role: session.role,
    startTime: session.startTime,
    lastSaved: session.lastSaved,
    status: session.status,
    questionsAnswered: progress.questionsAnswered,
    totalQuestions: progress.totalQuestions,
    progressPercentage: progress.progressPercentage
  }
}

// Session data sanitization
export const sanitizeSessionData = (session: Partial<SessionData>): Partial<SessionData> => {
  const sanitized = { ...session }

  // Sanitize string fields
  if (sanitized.jobDescription) {
    sanitized.jobDescription = sanitized.jobDescription.trim()
  }
  if (sanitized.role) {
    sanitized.role = sanitized.role.trim()
  }
  if (sanitized.selectedQuestion) {
    sanitized.selectedQuestion = sanitized.selectedQuestion.trim()
  }
  if (sanitized.partialTranscript) {
    sanitized.partialTranscript = sanitized.partialTranscript.trim()
  }

  // Ensure arrays are properly formatted
  if (sanitized.questions && Array.isArray(sanitized.questions)) {
    sanitized.questions = sanitized.questions.filter(q => q && q.trim().length > 0)
  }

  // Ensure numeric fields are valid
  if (sanitized.currentQuestionIndex !== undefined) {
    sanitized.currentQuestionIndex = Math.max(0, Math.floor(sanitized.currentQuestionIndex))
  }

  return sanitized
}

// Session comparison utilities
export const isSessionEqual = (session1: SessionData, session2: SessionData): boolean => {
  return (
    session1.id === session2.id &&
    session1.jobDescription === session2.jobDescription &&
    session1.role === session2.role &&
    session1.currentQuestionIndex === session2.currentQuestionIndex &&
    session1.selectedQuestion === session2.selectedQuestion &&
    session1.partialTranscript === session2.partialTranscript &&
    session1.status === session2.status
  )
}

export const hasSessionChanged = (original: SessionData, current: SessionData): boolean => {
  return !isSessionEqual(original, current)
}

// Session export/import utilities
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

// Storage quota utilities
export const getStorageQuotaInfo = async (): Promise<{
  usage: number
  quota: number
  usagePercentage: number
  availableSpace: number
} | null> => {
  try {
    if (!navigator.storage || !navigator.storage.estimate) {
      return null
    }

    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage || 0
    const quota = estimate.quota || 0
    const usagePercentage = quota > 0 ? (usage / quota) * 100 : 0
    const availableSpace = quota - usage

    return {
      usage,
      quota,
      usagePercentage: Math.round(usagePercentage * 100) / 100,
      availableSpace
    }
  } catch (error) {
    console.error('Failed to get storage quota info:', error)
    return null
  }
}

// Session cleanup utilities
export const shouldCleanupSession = (session: SessionData, ttl: number = 7 * 24 * 60 * 60 * 1000): boolean => {
  const now = new Date()
  const sessionAge = now.getTime() - session.lastSaved.getTime()
  return sessionAge > ttl
}

export const getSessionAge = (session: SessionData): number => {
  const now = new Date()
  return now.getTime() - session.lastSaved.getTime()
}

// Session analytics utilities
export const calculateSessionAnalytics = (sessions: SessionSummary[]): {
  totalSessions: number
  completedSessions: number
  incompleteSessions: number
  abandonedSessions: number
  averageProgress: number
  completionRate: number
} => {
  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const incompleteSessions = sessions.filter(s => s.status === 'in_progress').length
  const abandonedSessions = sessions.filter(s => s.status === 'abandoned').length
  
  const averageProgress = totalSessions > 0 
    ? sessions.reduce((sum, s) => sum + s.progressPercentage, 0) / totalSessions
    : 0
  
  const completionRate = totalSessions > 0 
    ? (completedSessions / totalSessions) * 100
    : 0

  return {
    totalSessions,
    completedSessions,
    incompleteSessions,
    abandonedSessions,
    averageProgress: Math.round(averageProgress * 100) / 100,
    completionRate: Math.round(completionRate * 100) / 100
  }
}
