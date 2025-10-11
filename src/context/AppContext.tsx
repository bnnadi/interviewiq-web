import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/apiService'
import { logger } from '../utils/logger'
import { MOCK_QUESTIONS, MOCK_FEEDBACK, type Feedback } from '../constants/mockData'

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

  const resetToInitialState = useCallback(() => {
    setJobData({ jd: '', role: '' })
    setQuestions([])
    setSelectedQuestion('')
    setTranscript('')
    setFeedback(null)
    setError(null)
    navigate('/dashboard')
  }, [navigate])

  const handleJobSubmit = useCallback(async (jd: string, role: string) => {
    setLoading(true)
    setError(null)
    
    try {
      logger.info('Sending job description to backend:', { role, jobDescription: jd })
      
      const data = await apiService.parseJobDescription(role, jd)
      logger.info('Backend response:', data)

      setJobData({ jd, role })
      setQuestions(data.questions || [])
      navigate('/interview/questions')
    } catch (error) {
      logger.error('Error parsing JD:', error)
      setError(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Fallback to mock data
      setJobData({ jd, role })
      setQuestions(MOCK_QUESTIONS)
      navigate('/interview/questions')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const handleQuestionSelect = useCallback((question: string) => {
    setSelectedQuestion(question)
    navigate('/interview/record')
  }, [navigate])

  const handleTranscriptComplete = useCallback(async (transcript: string) => {
    setTranscript(transcript)
    setLoading(true)
    setError(null)
    
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
      setError(`Failed to analyze answer: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Fallback to mock feedback
      setFeedback(MOCK_FEEDBACK)
      navigate('/interview/feedback')
    } finally {
      setLoading(false)
    }
  }, [jobData.jd, selectedQuestion, navigate])

  const handleStartOver = useCallback(() => {
    resetToInitialState()
  }, [resetToInitialState])

  const handleNextQuestion = useCallback(() => {
    setSelectedQuestion('')
    setTranscript('')
    setFeedback(null)
    setError(null)
    navigate('/interview/questions')
  }, [navigate])

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
    
    // Actions
    handleJobSubmit,
    handleQuestionSelect,
    handleTranscriptComplete,
    handleStartOver,
    handleNextQuestion,
    handleStartNewInterview,
    handleViewSessions,
    handleViewAnalytics,
    setError
  }), [
    jobData,
    questions,
    selectedQuestion,
    transcript,
    feedback,
    loading,
    error,
    handleJobSubmit,
    handleQuestionSelect,
    handleTranscriptComplete,
    handleStartOver,
    handleNextQuestion,
    handleStartNewInterview,
    handleViewSessions,
    handleViewAnalytics
  ])

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}
