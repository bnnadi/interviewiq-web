import React, { useState, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'
import JobInput from './components/JobInput'
import QuestionList from './components/QuestionList'
import AnswerRecorder from './components/AnswerRecorder'
import FeedbackView from './components/FeedbackView'
import ErrorMessage from './components/ui/ErrorMessage'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { apiService } from './services/apiService'
import { logger } from './utils/logger.js'
import { MOCK_QUESTIONS, MOCK_FEEDBACK } from './constants/mockData.js'
import { VIEWS } from './constants/appConstants.js'

function App() {
  const [currentView, setCurrentView] = useState(VIEWS.JOB_INPUT)
  const [jobData, setJobData] = useState({ jd: '', role: '' })
  const [questions, setQuestions] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState('')
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const resetToInitialState = useCallback(() => {
    setCurrentView(VIEWS.JOB_INPUT)
    setJobData({ jd: '', role: '' })
    setQuestions([])
    setSelectedQuestion('')
    setTranscript('')
    setFeedback(null)
    setError(null)
  }, [])

  const handleJobSubmit = useCallback(async (jd, role) => {
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
      setError(`Failed to generate questions: ${error.message}`)
      
      // Fallback to mock data
      setJobData({ jd, role })
      setQuestions(MOCK_QUESTIONS)
      setCurrentView(VIEWS.QUESTION_LIST)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleQuestionSelect = useCallback((question) => {
    setSelectedQuestion(question)
    setCurrentView(VIEWS.ANSWER_RECORDER)
  }, [])

  const handleTranscriptComplete = useCallback(async (transcript) => {
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

      setFeedback(data)
      setCurrentView(VIEWS.FEEDBACK)
    } catch (error) {
      logger.error('Error analyzing answer:', error)
      setError(`Failed to analyze answer: ${error.message}`)
      
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
          <>
            {currentView === VIEWS.JOB_INPUT && (
              <JobInput onSubmit={handleJobSubmit} />
            )}

            {currentView === VIEWS.QUESTION_LIST && (
              <QuestionList 
                questions={questions} 
                onQuestionSelect={handleQuestionSelect}
                onStartOver={handleStartOver}
              />
            )}

            {currentView === VIEWS.ANSWER_RECORDER && (
              <AnswerRecorder 
                question={selectedQuestion}
                onTranscriptComplete={handleTranscriptComplete}
                onBack={() => setCurrentView(VIEWS.QUESTION_LIST)}
              />
            )}

            {currentView === VIEWS.FEEDBACK && (
              <FeedbackView 
                feedback={feedback}
                transcript={transcript}
                question={selectedQuestion}
                onNextQuestion={handleNextQuestion}
                onStartOver={handleStartOver}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App 