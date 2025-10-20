import { useState, useEffect, useCallback, useRef } from 'react'
import { SessionData, SessionSummary, SessionEvent } from '../types/session'
import { sessionStorage, createSessionId, isSessionExpired } from '../services/sessionPersistence'
import { logger } from '../utils/logger'

interface UseSessionPersistenceOptions {
  autoSaveInterval?: number
  enableAutoSave?: boolean
  onSessionResumed?: (session: SessionData) => void
  onSessionSaved?: (session: SessionData) => void
  onError?: (error: string) => void
}

interface UseSessionPersistenceReturn {
  // Current session state
  currentSession: SessionData | null
  isSessionActive: boolean
  hasUnsavedChanges: boolean
  
  // Session management
  createSession: (jobDescription: string, role: string, questions: string[]) => Promise<string>
  saveSession: () => Promise<void>
  resumeSession: (sessionId: string) => Promise<boolean>
  completeSession: () => Promise<void>
  abandonSession: () => Promise<void>
  updateSession: (updates: Partial<SessionData>) => void
  
  // Session history
  sessionHistory: SessionSummary[]
  incompleteSessions: SessionSummary[]
  refreshSessionHistory: () => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  
  // Auto-save control
  enableAutoSave: () => void
  disableAutoSave: () => void
  
  // Cleanup
  clearExpiredSessions: () => Promise<void>
  clearAllSessions: () => Promise<void>
}

export const useSessionPersistence = (
  options: UseSessionPersistenceOptions = {}
): UseSessionPersistenceReturn => {
  const {
    autoSaveInterval = 30000, // 30 seconds
    enableAutoSave: initialAutoSave = true,
    onSessionResumed,
    onSessionSaved,
    onError
  } = options

  // State
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [sessionHistory, setSessionHistory] = useState<SessionSummary[]>([])
  const [incompleteSessions, setIncompleteSessions] = useState<SessionSummary[]>([])
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(initialAutoSave)

  // Refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedDataRef = useRef<string>('')

  // Initialize session history on mount
  useEffect(() => {
    refreshSessionHistory()
  }, [])

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && currentSession && hasUnsavedChanges) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      // Set new timer
      autoSaveTimerRef.current = setTimeout(() => {
        saveSession()
      }, autoSaveInterval)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [autoSaveEnabled, currentSession, hasUnsavedChanges, autoSaveInterval])

  // Listen to session events
  useEffect(() => {
    const eventManager = sessionStorage.getEventManager()

    const handleSessionSaved = (event: SessionEvent) => {
      if (event.type === 'session_saved') {
        setHasUnsavedChanges(false)
        onSessionSaved?.(event.data)
      }
    }

    const handleStorageError = (event: SessionEvent) => {
      if (event.type === 'storage_error') {
        onError?.(event.error)
      }
    }

    eventManager.on('session_saved', handleSessionSaved)
    eventManager.on('storage_error', handleStorageError)

    return () => {
      eventManager.off('session_saved', handleSessionSaved)
      eventManager.off('storage_error', handleStorageError)
    }
  }, [onSessionSaved, onError])

  // Create new session
  const createSession = useCallback(async (
    jobDescription: string, 
    role: string, 
    questions: string[]
  ): Promise<string> => {
    try {
      const sessionId = createSessionId()
      const now = new Date()

      const newSession: SessionData = {
        id: sessionId,
        jobDescription,
        role,
        questions,
        currentQuestionIndex: 0,
        selectedQuestion: '',
        partialTranscript: '',
        startTime: now,
        lastSaved: now,
        status: 'in_progress',
        mode: 'interview', // Default to interview mode
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          language: navigator.language
        }
      }

      await sessionStorage.saveSession(newSession)
      setCurrentSession(newSession)
      setIsSessionActive(true)
      setHasUnsavedChanges(false)
      lastSavedDataRef.current = JSON.stringify(newSession)

      logger.info('New session created:', sessionId)
      return sessionId
    } catch (error) {
      logger.error('Failed to create session:', error)
      onError?.(`Failed to create session: ${error}`)
      throw error
    }
  }, [onError])

  // Save current session
  const saveSession = useCallback(async (): Promise<void> => {
    if (!currentSession) return

    try {
      const sessionToSave = { ...currentSession }
      await sessionStorage.saveSession(sessionToSave)
      
      setCurrentSession(sessionToSave)
      setHasUnsavedChanges(false)
      lastSavedDataRef.current = JSON.stringify(sessionToSave)

      logger.info('Session saved:', currentSession.id)
    } catch (error) {
      logger.error('Failed to save session:', error)
      onError?.(`Failed to save session: ${error}`)
      throw error
    }
  }, [currentSession, onError])

  // Resume existing session
  const resumeSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const session = await sessionStorage.getSession(sessionId)
      
      if (!session) {
        logger.warn('Session not found:', sessionId)
        return false
      }

      if (isSessionExpired(session)) {
        logger.warn('Session expired:', sessionId)
        await sessionStorage.deleteSession(sessionId)
        return false
      }

      setCurrentSession(session)
      setIsSessionActive(true)
      setHasUnsavedChanges(false)
      lastSavedDataRef.current = JSON.stringify(session)

      onSessionResumed?.(session)
      logger.info('Session resumed:', sessionId)
      return true
    } catch (error) {
      logger.error('Failed to resume session:', error)
      onError?.(`Failed to resume session: ${error}`)
      return false
    }
  }, [onSessionResumed, onError])

  // Complete current session
  const completeSession = useCallback(async (): Promise<void> => {
    if (!currentSession) return

    try {
      const completedSession = {
        ...currentSession,
        status: 'completed' as const,
        lastSaved: new Date()
      }

      await sessionStorage.saveSession(completedSession)
      
      setCurrentSession(null)
      setIsSessionActive(false)
      setHasUnsavedChanges(false)
      lastSavedDataRef.current = ''

      // Refresh session history
      await refreshSessionHistory()

      logger.info('Session completed:', currentSession.id)
    } catch (error) {
      logger.error('Failed to complete session:', error)
      onError?.(`Failed to complete session: ${error}`)
      throw error
    }
  }, [currentSession, onError])

  // Abandon current session
  const abandonSession = useCallback(async (): Promise<void> => {
    if (!currentSession) return

    try {
      const abandonedSession = {
        ...currentSession,
        status: 'abandoned' as const,
        lastSaved: new Date()
      }

      await sessionStorage.saveSession(abandonedSession)
      
      setCurrentSession(null)
      setIsSessionActive(false)
      setHasUnsavedChanges(false)
      lastSavedDataRef.current = ''

      // Refresh session history
      await refreshSessionHistory()

      logger.info('Session abandoned:', currentSession.id)
    } catch (error) {
      logger.error('Failed to abandon session:', error)
      onError?.(`Failed to abandon session: ${error}`)
      throw error
    }
  }, [currentSession, onError])

  // Refresh session history
  const refreshSessionHistory = useCallback(async (): Promise<void> => {
    try {
      const [allSessions, incomplete] = await Promise.all([
        sessionStorage.getAllSessions(),
        sessionStorage.getIncompleteSessions()
      ])

      setSessionHistory(allSessions)
      setIncompleteSessions(incomplete)
    } catch (error) {
      logger.error('Failed to refresh session history:', error)
      onError?.(`Failed to refresh session history: ${error}`)
    }
  }, [onError])

  // Update session data (triggers auto-save)
  const updateSession = useCallback((updates: Partial<SessionData>) => {
    if (!currentSession) return

    const updatedSession = { ...currentSession, ...updates }
    setCurrentSession(updatedSession)

    // Check if there are actual changes
    const currentData = JSON.stringify(updatedSession)
    if (currentData !== lastSavedDataRef.current) {
      setHasUnsavedChanges(true)
    }
  }, [currentSession])

  // Auto-save control
  const enableAutoSave = useCallback(() => {
    setAutoSaveEnabled(true)
  }, [])

  const disableAutoSave = useCallback(() => {
    setAutoSaveEnabled(false)
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
  }, [])

  // Cleanup functions
  const clearExpiredSessions = useCallback(async (): Promise<void> => {
    try {
      await sessionStorage.clearExpiredSessions()
      await refreshSessionHistory()
      logger.info('Expired sessions cleared')
    } catch (error) {
      logger.error('Failed to clear expired sessions:', error)
      onError?.(`Failed to clear expired sessions: ${error}`)
    }
  }, [refreshSessionHistory, onError])

  const clearAllSessions = useCallback(async (): Promise<void> => {
    try {
      await sessionStorage.clearAllSessions()
      setSessionHistory([])
      setIncompleteSessions([])
      logger.info('All sessions cleared')
    } catch (error) {
      logger.error('Failed to clear all sessions:', error)
      onError?.(`Failed to clear all sessions: ${error}`)
    }
  }, [onError])

  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      await sessionStorage.deleteSession(sessionId)
      await refreshSessionHistory()
      logger.info('Session deleted:', sessionId)
    } catch (error) {
      logger.error('Failed to delete session:', error)
      onError?.(`Failed to delete session: ${error}`)
      throw error
    }
  }, [refreshSessionHistory, onError])

  // Expose updateSession for external use
  return {
    currentSession,
    isSessionActive,
    hasUnsavedChanges,
    createSession,
    saveSession,
    resumeSession,
    completeSession,
    abandonSession,
    updateSession,
    sessionHistory,
    incompleteSessions,
    refreshSessionHistory,
    deleteSession,
    enableAutoSave,
    disableAutoSave,
    clearExpiredSessions,
    clearAllSessions
  }
}
