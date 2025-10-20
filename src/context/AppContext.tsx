import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/apiService'
import { logger } from '../utils/logger'
import { MOCK_QUESTIONS, MOCK_FEEDBACK, type Feedback } from '../constants/mockData'
import { useSessionPersistence } from '../hooks/useSessionPersistence'
import { SessionData } from '../types/session'

interface JobData {
  jd: string
  role: string
}

interface AppContextType {
  // State
  jobData: JobData
  questions: string[]
  selectedQuestion: string
  transcript: string
  feedback: Feedback | null
  loading: boolean
  error: string | null
  
  // Session persistence state
  currentSession: SessionData | null
  isSessionActive: boolean
  hasUnsavedChanges: boolean
  
  // Actions
  handleJobSubmit: (jd: string, role: string) => Promise<void>
  handleQuestionSelect: (question: string) => void
  handleTranscriptComplete: (transcript: string) => Promise<void>
  handleStartOver: () => void
  handleNextQuestion: () => void
  handleStartNewInterview: () => void
  handleViewSessions: () => void
  handleViewAnalytics: () => void
  setError: (error: string | null) => void
  
  // Session persistence actions
  createSession: (jd: string, role: string, questions: string[]) => Promise<string>
  saveSession: () => Promise<void>
  resumeSession: (sessionId: string) => Promise<boolean>
  completeSession: () => Promise<void>
  abandonSession: () => Promise<void>
  updateSession: (updates: Partial<SessionData>) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

interface AppProviderProps {
  children: React.ReactNode
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const navigate = useNavigate()
  
  const [jobData, setJobData] = useState<JobData>({ jd: '', role: '' })
  const [questions, setQuestions] = useState<string[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<string>('')
  const [transcript, setTranscript] = useState<string>('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Session persistence hook
  const {
    currentSession,
    isSessionActive,
    hasUnsavedChanges,
    createSession: createSessionPersistence,
    saveSession: saveSessionPersistence,
    resumeSession: resumeSessionPersistence,
    completeSession: completeSessionPersistence,
    abandonSession: abandonSessionPersistence,
    updateSession: updateSessionPersistence
  } = useSessionPersistence({
    onSessionResumed: (session) => {
      // Sync session data with local state
      setJobData({ jd: session.jobDescription, role: session.role })
      setQuestions(session.questions)
      setSelectedQuestion(session.selectedQuestion)
      setTranscript(session.partialTranscript)
      setFeedback(null)
      setError(null)
      
      // Navigate to appropriate page based on progress
      if (session.currentQuestionIndex === 0) {
        navigate('/interview/questions')
      } else if (session.selectedQuestion) {
        navigate('/interview/record')
      } else {
        navigate('/interview/questions')
      }
    },
    onError: (errorMessage) => {
      setError(errorMessage)
    }
  })

  const resetToInitialState = useCallback(() => {
    setJobData({ jd: '', role: '' })
    setQuestions([])
    setSelectedQuestion('')
    setTranscript('')
    setFeedback(null)
    setError(null)
    navigate('/dashboard')
  }, [navigate])

  // Helper function to extract error message
  const getErrorMessage = useCallback((error: any, defaultMessage: string): string => {
    return error.userMessage || `${defaultMessage}: ${error instanceof Error ? error.message : 'Unknown error'}`
  }, [])

  // Helper function to handle fallback with mock data
  const handleFallbackWithMockData = useCallback(async (jd: string, role: string) => {
    const questions = MOCK_QUESTIONS
    setJobData({ jd, role })
    setQuestions(questions)
    
    try {
      await createSessionPersistence(jd, role, questions)
    } catch (sessionError) {
      logger.error('Failed to create session with mock data:', sessionError)
    }
    
    navigate('/interview/questions')
  }, [createSessionPersistence, navigate])

  const handleJobSubmit = useCallback(async (jd: string, role: string) => {
    setLoading(true)
    setError(null)
    
    try {
      logger.info('Sending job description to backend:', { role, jobDescription: jd })
      
      const data = await apiService.parseJobDescription(role, jd)
      logger.info('Backend response:', data)

      const questions = data.questions || MOCK_QUESTIONS
      setJobData({ jd, role })
      setQuestions(questions)
      
      // Create session for persistence
      await createSessionPersistence(jd, role, questions)
      
      navigate('/interview/questions')
    } catch (error) {
      logger.error('Error parsing JD:', error)
      
      // Extract error message using helper function
      const errorMessage = getErrorMessage(error, 'Failed to generate questions')
      setError(errorMessage)
      
      // Handle fallback using helper function
      await handleFallbackWithMockData(jd, role)
    } finally {
      setLoading(false)
    }
  }, [navigate, createSessionPersistence, getErrorMessage, handleFallbackWithMockData])

  const handleQuestionSelect = useCallback((question: string) => {
    setSelectedQuestion(question)
    
    // Update session with selected question
    if (currentSession) {
      updateSessionPersistence({
        selectedQuestion: question,
        currentQuestionIndex: questions.indexOf(question)
      })
    }
    
    navigate('/interview/record')
  }, [navigate, currentSession, questions, updateSessionPersistence])

  const handleTranscriptComplete = useCallback(async (transcript: string) => {
    setTranscript(transcript)
    setLoading(true)
    setError(null)
    
    // Update session with transcript
    if (currentSession) {
      updateSessionPersistence({
        partialTranscript: transcript
      })
    }
    
    try {
      logger.info('Sending answer for analysis:', {
        jobDescription: jobData.jd,
        question: selectedQuestion,
        answer: transcript
      })
      
      const data = await apiService.analyzeAnswer(jobData.jd, selectedQuestion, transcript)
      logger.info('Analysis response:', data)

      setFeedback(data as Feedback)
      navigate('/interview/feedback')
    } catch (error) {
      logger.error('Error analyzing answer:', error)
      
      // Extract error message using helper function
      const errorMessage = getErrorMessage(error, 'Failed to analyze answer')
      setError(errorMessage)
      
      // Fallback to mock feedback
      setFeedback(MOCK_FEEDBACK)
      navigate('/interview/feedback')
    } finally {
      setLoading(false)
    }
  }, [jobData.jd, selectedQuestion, navigate, currentSession, updateSessionPersistence, getErrorMessage])

  const handleStartOver = useCallback(async () => {
    // Abandon current session if active
    if (isSessionActive && currentSession) {
      try {
        await abandonSessionPersistence()
      } catch (error) {
        logger.error('Failed to abandon session:', error)
      }
    }
    
    resetToInitialState()
  }, [resetToInitialState, isSessionActive, currentSession, abandonSessionPersistence])

  const handleNextQuestion = useCallback(async () => {
    setSelectedQuestion('')
    setTranscript('')
    setFeedback(null)
    setError(null)
    
    // Update session for next question
    if (currentSession) {
      updateSessionPersistence({
        selectedQuestion: '',
        partialTranscript: '',
        currentQuestionIndex: currentSession.currentQuestionIndex + 1
      })
    }
    
    navigate('/interview/questions')
  }, [navigate, currentSession, updateSessionPersistence])

  // Dashboard navigation handlers
  const handleStartNewInterview = useCallback(() => {
    navigate('/interview/new')
  }, [navigate])

  const handleViewSessions = useCallback(() => {
    // TODO: Implement session history view
    console.log('Navigate to sessions - not yet implemented')
  }, [])

  const handleViewAnalytics = useCallback(() => {
    // TODO: Implement analytics view
    console.log('Navigate to analytics - not yet implemented')
  }, [])

  const value = useMemo(() => ({
    // State
    jobData,
    questions,
    selectedQuestion,
    transcript,
    feedback,
    loading,
    error,
    
    // Session persistence state
    currentSession,
    isSessionActive,
    hasUnsavedChanges,
    
    // Actions
    handleJobSubmit,
    handleQuestionSelect,
    handleTranscriptComplete,
    handleStartOver,
    handleNextQuestion,
    handleStartNewInterview,
    handleViewSessions,
    handleViewAnalytics,
    setError,
    
    // Session persistence actions
    createSession: createSessionPersistence,
    saveSession: saveSessionPersistence,
    resumeSession: resumeSessionPersistence,
    completeSession: completeSessionPersistence,
    abandonSession: abandonSessionPersistence,
    updateSession: updateSessionPersistence
  }), [
    jobData,
    questions,
    selectedQuestion,
    transcript,
    feedback,
    loading,
    error,
    currentSession,
    isSessionActive,
    hasUnsavedChanges,
    handleJobSubmit,
    handleQuestionSelect,
    handleTranscriptComplete,
    handleStartOver,
    handleNextQuestion,
    handleStartNewInterview,
    handleViewSessions,
    handleViewAnalytics,
    createSessionPersistence,
    saveSessionPersistence,
    resumeSessionPersistence,
    completeSessionPersistence,
    abandonSessionPersistence,
    updateSessionPersistence
  ])

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
