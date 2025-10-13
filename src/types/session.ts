// Session persistence types and interfaces

export interface SessionData {
  id: string
  jobDescription: string
  role: string
  questions: string[]
  currentQuestionIndex: number
  selectedQuestion: string
  partialTranscript: string
  startTime: Date
  lastSaved: Date
  status: 'in_progress' | 'completed' | 'abandoned'
  // Session mode and context
  mode: 'practice' | 'interview'
  scenarioId?: string // For practice scenarios
  jobContext?: {
    jobTitle: string
    jobDescription: string
    company?: string
  }
  // Optional fields for future enhancements
  audioData?: string // Base64 encoded audio if needed
  intermediateScores?: number[]
  userNotes?: string
  deviceInfo?: {
    userAgent: string
    screenResolution: string
    language: string
  }
}

export interface SessionSummary {
  id: string
  role: string
  startTime: Date
  lastSaved: Date
  status: SessionData['status']
  questionsAnswered: number
  totalQuestions: number
  progressPercentage: number
}

export interface SessionStorageOptions {
  maxSessions?: number
  sessionTTL?: number // in milliseconds
  autoSaveInterval?: number // in milliseconds
  enableCompression?: boolean
}

export interface SessionStorageService {
  saveSession(session: SessionData): Promise<void>
  getSession(sessionId: string): Promise<SessionData | null>
  getAllSessions(): Promise<SessionSummary[]>
  getIncompleteSessions(): Promise<SessionSummary[]>
  deleteSession(sessionId: string): Promise<void>
  clearExpiredSessions(): Promise<void>
  clearAllSessions(): Promise<void>
  getStorageSize(): Promise<number>
}

// Session events for real-time updates
export type SessionEvent = 
  | { type: 'session_saved'; sessionId: string; data: SessionData }
  | { type: 'session_deleted'; sessionId: string }
  | { type: 'session_resumed'; sessionId: string; data: SessionData }
  | { type: 'storage_error'; error: string }

export interface SessionEventEmitter {
  on(event: SessionEvent['type'], callback: (data: any) => void): void
  off(event: SessionEvent['type'], callback: (data: any) => void): void
  emit(event: SessionEvent): void
}
