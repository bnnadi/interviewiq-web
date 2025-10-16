import { 
  SessionData, 
  SessionSummary, 
  SessionStorageOptions, 
  SessionStorageService,
  SessionEvent,
  SessionEventEmitter 
} from '../types/session'
import { logger } from '../utils/logger'

// Default configuration
const DEFAULT_OPTIONS: Required<SessionStorageOptions> = {
  maxSessions: 50,
  sessionTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  autoSaveInterval: 30000, // 30 seconds
  enableCompression: false
}

// Event emitter for session events
class SessionEventManager implements SessionEventEmitter {
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  on(event: SessionEvent['type'], callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: SessionEvent['type'], callback: (data: any) => void): void {
    this.listeners.get(event)?.delete(callback)
  }

  emit(event: SessionEvent): void {
    this.listeners.get(event.type)?.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        logger.error('Error in session event listener:', error)
      }
    })
  }
}

// IndexedDB-based session storage implementation
export class IndexedDBSessionStorage implements SessionStorageService {
  private dbName = 'Confida_Sessions'
  private dbVersion = 1
  private storeName = 'sessions'
  private db: IDBDatabase | null = null
  private options: Required<SessionStorageOptions>
  private eventManager = new SessionEventManager()

  constructor(options: SessionStorageOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  // Initialize IndexedDB connection
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        logger.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create sessions store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          
          // Create indexes for efficient querying
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('lastSaved', 'lastSaved', { unique: false })
          store.createIndex('startTime', 'startTime', { unique: false })
        }
      }
    })
  }

  // Save session to IndexedDB
  async saveSession(session: SessionData): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      // Update lastSaved timestamp
      const sessionToSave = {
        ...session,
        lastSaved: new Date()
      }

      await new Promise<void>((resolve, reject) => {
        const request = store.put(sessionToSave)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      // Emit event
      this.eventManager.emit({
        type: 'session_saved',
        sessionId: session.id,
        data: sessionToSave
      })

      logger.info('Session saved successfully:', session.id)
    } catch (error) {
      logger.error('Failed to save session:', error)
      this.eventManager.emit({
        type: 'storage_error',
        error: `Failed to save session: ${error}`
      })
      throw error
    }
  }

  // Get session by ID
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)

      return new Promise<SessionData | null>((resolve, reject) => {
        const request = store.get(sessionId)
        request.onsuccess = () => {
          const session = request.result
          if (session) {
            // Convert date strings back to Date objects
            session.startTime = new Date(session.startTime)
            session.lastSaved = new Date(session.lastSaved)
          }
          resolve(session || null)
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      logger.error('Failed to get session:', error)
      return null
    }
  }

  // Get all sessions as summaries
  async getAllSessions(): Promise<SessionSummary[]> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)

      return new Promise<SessionSummary[]>((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => {
          const sessions = request.result as SessionData[]
          const summaries = sessions.map(this.createSessionSummary)
          resolve(summaries.sort((a, b) => b.lastSaved.getTime() - a.lastSaved.getTime()))
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      logger.error('Failed to get all sessions:', error)
      return []
    }
  }

  // Get incomplete sessions only
  async getIncompleteSessions(): Promise<SessionSummary[]> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('status')

      return new Promise<SessionSummary[]>((resolve, reject) => {
        const request = index.getAll('in_progress')
        request.onsuccess = () => {
          const sessions = request.result as SessionData[]
          const summaries = sessions.map(this.createSessionSummary)
          resolve(summaries.sort((a, b) => b.lastSaved.getTime() - a.lastSaved.getTime()))
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      logger.error('Failed to get incomplete sessions:', error)
      return []
    }
  }

  // Delete session
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(sessionId)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      this.eventManager.emit({
        type: 'session_deleted',
        sessionId
      })

      logger.info('Session deleted:', sessionId)
    } catch (error) {
      logger.error('Failed to delete session:', error)
      throw error
    }
  }

  // Clear expired sessions
  async clearExpiredSessions(): Promise<void> {
    try {
      const now = new Date()
      const cutoffTime = new Date(now.getTime() - this.options.sessionTTL)
      
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('lastSaved')

      const range = IDBKeyRange.upperBound(cutoffTime)
      const request = index.openCursor(range)

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }

      logger.info('Expired sessions cleared')
    } catch (error) {
      logger.error('Failed to clear expired sessions:', error)
    }
  }

  // Privacy-focused method to clear all sensitive data
  async clearAllSensitiveData(): Promise<void> {
    try {
      await this.clearAllSessions()
      
      // Also clear any other sensitive data that might be stored
      if (typeof localStorage !== 'undefined') {
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('Confida_')) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      }
      
      logger.info('All sensitive data cleared')
    } catch (error) {
      logger.error('Failed to clear sensitive data:', error)
      throw error
    }
  }

  // Clear all sessions
  async clearAllSessions(): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      await new Promise<void>((resolve, reject) => {
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      logger.info('All sessions cleared')
    } catch (error) {
      logger.error('Failed to clear all sessions:', error)
      throw error
    }
  }

  // Get storage size (approximate)
  async getStorageSize(): Promise<number> {
    try {
      if (!navigator.storage || !navigator.storage.estimate) {
        return 0
      }

      const estimate = await navigator.storage.estimate()
      return estimate.usage || 0
    } catch (error) {
      logger.error('Failed to get storage size:', error)
      return 0
    }
  }

  // Create session summary from full session data
  private createSessionSummary(session: SessionData): SessionSummary {
    return {
      id: session.id,
      role: session.role,
      startTime: new Date(session.startTime),
      lastSaved: new Date(session.lastSaved),
      status: session.status,
      questionsAnswered: session.currentQuestionIndex,
      totalQuestions: session.questions.length,
      progressPercentage: session.questions.length > 0 
        ? Math.round((session.currentQuestionIndex / session.questions.length) * 100)
        : 0
    }
  }

  // Get event manager for subscribing to events
  getEventManager(): SessionEventEmitter {
    return this.eventManager
  }
}

// Create singleton instance
export const sessionStorage = new IndexedDBSessionStorage()

// Utility functions
export const createSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const isSessionExpired = (session: SessionData, ttl: number = DEFAULT_OPTIONS.sessionTTL): boolean => {
  const now = new Date()
  const sessionAge = now.getTime() - session.lastSaved.getTime()
  return sessionAge > ttl
}
