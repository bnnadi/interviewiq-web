import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import { Badge } from '@components/ui/Badge'
import QuestionList from '@components/QuestionList'
import AnswerRecorder from '@components/AnswerRecorder'
import { apiService } from '@services/apiService'
import { logger } from '@utils/logger'
import { SessionData } from '@types/session'

interface SessionSimulationProps {}

const SessionSimulation: React.FC<SessionSimulationProps> = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [questions, setQuestions] = useState<string[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionId) {
      loadSession()
    }
  }, [sessionId])

  const loadSession = async () => {
    if (!sessionId) return

    try {
      setIsLoading(true)
      setError(null)

      logger.info('Loading session:', sessionId)
      
      // Try to get session from API first
      try {
        const response = await apiService.getSession(sessionId)
        logger.info('Session loaded from API:', response)
        
        setSessionData(response.sessionData)
        setQuestions(response.questions || [])
        setSelectedQuestion(response.sessionData?.selectedQuestion || '')
      } catch (apiError) {
        logger.warn('API session load failed, using fallback:', apiError)
        
        // Fallback: create a mock session for development
        const mockSession: SessionData = {
          id: sessionId,
          jobDescription: 'Mock job description for development',
          role: 'Software Engineer',
          questions: [
            'Tell me about yourself',
            'What are your strengths and weaknesses?',
            'Why do you want to work here?',
            'Describe a challenging project you worked on',
            'Where do you see yourself in 5 years?'
          ],
          currentQuestionIndex: 0,
          selectedQuestion: '',
          partialTranscript: '',
          startTime: new Date(),
          lastSaved: new Date(),
          status: 'in_progress',
          mode: 'interview',
          jobContext: {
            jobTitle: 'Software Engineer',
            jobDescription: 'Mock job description for development'
          }
        }
        
        setSessionData(mockSession)
        setQuestions(mockSession.questions)
      }
    } catch (error) {
      logger.error('Failed to load session:', error)
      setError('Failed to load interview session. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuestionSelect = (question: string) => {
    setSelectedQuestion(question)
    
    // Update session with selected question
    if (sessionData) {
      const updatedSession = {
        ...sessionData,
        selectedQuestion: question,
        currentQuestionIndex: questions.indexOf(question)
      }
      setSessionData(updatedSession)
      
      // Update session on server
      apiService.updateSession(sessionId!, {
        selectedQuestion: question,
        currentQuestionIndex: questions.indexOf(question)
      }).catch(error => {
        logger.error('Failed to update session:', error)
      })
    }
  }

  const handleTranscriptComplete = async (transcript: string) => {
    if (!sessionData || !selectedQuestion) return

    try {
      logger.info('Processing answer:', { question: selectedQuestion, transcript })
      
      // Update session with transcript
      const updatedSession = {
        ...sessionData,
        partialTranscript: transcript
      }
      setSessionData(updatedSession)
      
      // Update session on server
      await apiService.updateSession(sessionId!, {
        partialTranscript: transcript
      })

      // Analyze the answer
      const analysis = await apiService.analyzeAnswer(
        sessionData.jobDescription,
        selectedQuestion,
        transcript
      )

      logger.info('Answer analysis complete:', analysis)
      
      // Navigate to feedback page with the analysis
      navigate('/interview/feedback', { 
        state: { 
          analysis,
          sessionData: updatedSession,
          question: selectedQuestion,
          answer: transcript
        }
      })
    } catch (error) {
      logger.error('Failed to process answer:', error)
      setError('Failed to analyze your answer. Please try again.')
    }
  }

  const handleBack = () => {
    if (selectedQuestion) {
      setSelectedQuestion('')
    } else {
      navigate('/practice')
    }
  }

  const handleFinishInterview = async () => {
    if (!sessionId) return

    try {
      await apiService.completeSession(sessionId)
      navigate('/feedback/summary')
    } catch (error) {
      logger.error('Failed to complete session:', error)
      navigate('/feedback/summary')
    }
  }

  const getSessionTypeLabel = () => {
    if (!sessionData) return 'Interview Session'
    
    if (sessionData.mode === 'practice') {
      return `Practice Scenario: ${sessionData.role}`
    } else {
      return `Job-Based Interview: ${sessionData.jobContext?.jobTitle || sessionData.role}`
    }
  }

  const getSessionTypeDescription = () => {
    if (!sessionData) return ''
    
    if (sessionData.mode === 'practice') {
      return 'Practice interview questions for skill development'
    } else {
      return `Interview for ${sessionData.jobContext?.company ? `at ${sessionData.jobContext.company}` : 'your target role'}`
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview session...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/practice')} className="w-full">
            Back to Practice
          </Button>
        </Card>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto text-center">
          <div className="text-gray-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Not Found</h2>
          <p className="text-gray-600 mb-6">The requested interview session could not be found.</p>
          <Button onClick={() => navigate('/practice')} className="w-full">
            Back to Practice
          </Button>
        </Card>
      </div>
    )
  }

  // If a question is selected, show the recording interface
  if (selectedQuestion) {
    return (
      <div className="space-y-6">
        {/* Session Header */}
        <div className="text-center">
          <Badge variant="secondary" className="mb-2">
            {getSessionTypeLabel()}
          </Badge>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Interview Simulation
          </h1>
          <p className="text-gray-600">
            {getSessionTypeDescription()}
          </p>
        </div>

        <Card className="p-6">
          <AnswerRecorder
            question={selectedQuestion}
            onTranscriptComplete={handleTranscriptComplete}
            onBack={handleBack}
          />
        </Card>

        <div className="flex justify-center space-x-4">
          <Button
            onClick={handleBack}
            variant="outline"
            className="px-6 py-2"
          >
            ← Back to Questions
          </Button>
          <Button
            onClick={handleFinishInterview}
            className="px-6 py-2 bg-green-600 hover:bg-green-700"
          >
            Finish Interview →
          </Button>
        </div>
      </div>
    )
  }

  // Show question selection interface
  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="text-center">
        <Badge variant="secondary" className="mb-2">
          {getSessionTypeLabel()}
        </Badge>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Interview Questions
        </h1>
        <p className="text-gray-600">
          {getSessionTypeDescription()}
        </p>
      </div>

      <Card className="p-6">
        <QuestionList
          questions={questions}
          onQuestionSelect={handleQuestionSelect}
          onStartOver={() => navigate('/practice')}
        />
      </Card>

      <div className="flex justify-center">
        <Button
          onClick={() => navigate('/practice')}
          variant="outline"
          className="px-6 py-2"
        >
          ← Back to Practice
        </Button>
      </div>
    </div>
  )
}

export default SessionSimulation
