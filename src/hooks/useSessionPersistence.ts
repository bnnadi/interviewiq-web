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

  // Extract auto-save timer management
  const clearAutoSaveTimer = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
  }, [])

  const setAutoSaveTimer = useCallback(() => {
    clearAutoSaveTimer()
    autoSaveTimerRef.current = setTimeout(() => {
      saveSession()
    }, autoSaveInterval)
  }, [saveSession, autoSaveInterval, clearAutoSaveTimer])

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && currentSession && hasUnsavedChanges) {
      setAutoSaveTimer()
    }

    return clearAutoSaveTimer
  }, [autoSaveEnabled, currentSession, hasUnsavedChanges, setAutoSaveTimer, clearAutoSaveTimer])

  // Extract event handlers
  const handleSessionSaved = useCallback((event: SessionEvent) => {
    if (event.type === 'session_saved') {
      setHasUnsavedChanges(false)
      onSessionSaved?.(event.data)
    }
  }, [onSessionSaved])

  const handleStorageError = useCallback((event: SessionEvent) => {
    if (event.type === 'storage_error') {
      onError?.(event.error)
    }
  }, [onError])

  // Listen to session events
  useEffect(() => {
    const eventManager = sessionStorage.getEventManager()

    eventManager.on('session_saved', handleSessionSaved)
    eventManager.on('storage_error', handleStorageError)

    return () => {
      eventManager.off('session_saved', handleSessionSaved)
      eventManager.off('storage_error', handleStorageError)
    }
  }, [handleSessionSaved, handleStorageError])

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
      updateSessionState(newSession, true)

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
      updateSessionState(sessionToSave, true)

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

      updateSessionState(session, true)

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
      updateSessionState(null, false)

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
      updateSessionState(null, false)

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

  // Extract session state management
  const updateSessionState = useCallback((session: SessionData | null, isActive: boolean = false) => {
    setCurrentSession(session)
    setIsSessionActive(isActive)
    setHasUnsavedChanges(false)
    lastSavedDataRef.current = session ? JSON.stringify(session) : ''
  }, [])

  const checkForChanges = useCallback((session: SessionData) => {
    const currentData = JSON.stringify(session)
    if (currentData !== lastSavedDataRef.current) {
      setHasUnsavedChanges(true)
    }
  }, [])

  // Update session data (triggers auto-save)
  const updateSession = useCallback((updates: Partial<SessionData>) => {
    if (!currentSession) return

    const updatedSession = { ...currentSession, ...updates }
    setCurrentSession(updatedSession)
    checkForChanges(updatedSession)
  }, [currentSession, checkForChanges])

  // Auto-save control
  const enableAutoSave = useCallback(() => {
    setAutoSaveEnabled(true)
  }, [])

  const disableAutoSave = useCallback(() => {
    setAutoSaveEnabled(false)
    clearAutoSaveTimer()
  }, [clearAutoSaveTimer])

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
