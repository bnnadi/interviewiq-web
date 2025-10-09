import { useState, useCallback, useMemo } from 'react'
import { Toaster } from 'react-hot-toast'
import ViewRenderer from './components/ViewRenderer'
import ErrorMessage from './components/shared/ui/ErrorMessage'
import LoadingSpinner from './components/shared/ui/LoadingSpinner'
import { apiService } from './services/apiService'
import { logger } from './utils/logger'
import { MOCK_QUESTIONS, MOCK_FEEDBACK, type Feedback } from './constants/mockData'
import { VIEWS, type ViewType } from './constants/appConstants'

interface JobData {
  jd: string
  role: string
}

function App(): JSX.Element {
  const [currentView, setCurrentView] = useState<ViewType>(VIEWS.JOB_INPUT)
  const [jobData, setJobData] = useState<JobData>({ jd: '', role: '' })
  const [questions, setQuestions] = useState<string[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<string>('')
  const [transcript, setTranscript] = useState<string>('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const resetToInitialState = useCallback(() => {
    setCurrentView(VIEWS.JOB_INPUT)
    setJobData({ jd: '', role: '' })
    setQuestions([])
    setSelectedQuestion('')
    setTranscript('')
    setFeedback(null)
    setError(null)
  }, [])

  const handleJobSubmit = useCallback(async (jd: string, role: string) => {
    setLoading(true)
    setError(null)
    
    try {
      logger.info('Sending job description to backend:', { role, jobDescription: jd })
      
      const data = await apiService.parseJobDescription(role, jd)
      logger.info('Backend response:', data)

      setJobData({ jd, role })
      setQuestions(data.questions || [])
      setCurrentView(VIEWS.QUESTION_LIST)
    } catch (error) {
      logger.error('Error parsing JD:', error)
      setError(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Fallback to mock data
      setJobData({ jd, role })
      setQuestions(MOCK_QUESTIONS)
      setCurrentView(VIEWS.QUESTION_LIST)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleQuestionSelect = useCallback((question: string) => {
    setSelectedQuestion(question)
    setCurrentView(VIEWS.ANSWER_RECORDER)
  }, [])

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
      setCurrentView(VIEWS.FEEDBACK)
    } catch (error) {
      logger.error('Error analyzing answer:', error)
      setError(`Failed to analyze answer: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Fallback to mock feedback
      setFeedback(MOCK_FEEDBACK)
      setCurrentView(VIEWS.FEEDBACK)
    } finally {
      setLoading(false)
    }
  }, [jobData.jd, selectedQuestion])

  const handleStartOver = useCallback(() => {
    resetToInitialState()
  }, [resetToInitialState])

  const handleNextQuestion = useCallback(() => {
    setCurrentView(VIEWS.QUESTION_LIST)
    setSelectedQuestion('')
    setTranscript('')
    setFeedback(null)
    setError(null)
  }, [])

  const viewProps = useMemo(() => ({
    // JobInput props
    onSubmit: handleJobSubmit,
    
    // QuestionList props
    questions,
    onQuestionSelect: handleQuestionSelect,
    onStartOver: handleStartOver,
    
    // AnswerRecorder props
    question: selectedQuestion,
    onTranscriptComplete: handleTranscriptComplete,
    onBack: () => setCurrentView(VIEWS.QUESTION_LIST),
    
    // FeedbackView props
    feedback,
    transcript,
    onNextQuestion: handleNextQuestion
  }), [handleJobSubmit, questions, handleQuestionSelect, handleStartOver, selectedQuestion, handleTranscriptComplete, feedback, transcript, handleNextQuestion])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            InterviewIQ
          </h1>
          <p className="text-gray-600">
            AI-powered interview coaching with intelligent feedback
          </p>
        </header>

        <ErrorMessage error={error} onDismiss={() => setError(null)} />

        {loading && <LoadingSpinner message="Processing..." />}

        {!loading && (
          <ViewRenderer 
            currentView={currentView} 
            viewProps={viewProps}
          />
        )}
      </div>
    </div>
  )
}

export default App 