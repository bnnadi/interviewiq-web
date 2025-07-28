import React, { useState } from 'react'
import JobInput from './components/JobInput'
import QuestionList from './components/QuestionList'
import AnswerRecorder from './components/AnswerRecorder'
import FeedbackView from './components/FeedbackView'

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_ENDPOINTS = {
  parseJD: `${API_BASE_URL}/api/v1/parse-jd`,
  analyzeAnswer: `${API_BASE_URL}/api/v1/analyze-answer`,
  services: `${API_BASE_URL}/api/v1/services`
}

function App() {
  const [currentView, setCurrentView] = useState('job-input')
  const [jobData, setJobData] = useState({ jd: '', role: '' })
  const [questions, setQuestions] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState('')
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleJobSubmit = async (jd, role) => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Sending job description to backend:', { role, jobDescription: jd })
      
      const response = await fetch(API_ENDPOINTS.parseJD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          role: role, 
          jobDescription: jd 
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Backend response:', data)

      setJobData({ jd, role })
      setQuestions(data.questions || [])
      setCurrentView('question-list')
    } catch (error) {
      console.error('Error parsing JD:', error)
      setError(`Failed to generate questions: ${error.message}`)
      
      // Fallback to mock data
      setJobData({ jd, role })
      setQuestions([
        "Tell me about a time when you had to lead a team through a challenging project.",
        "How do you handle conflicting priorities and deadlines?",
        "Describe a situation where you had to learn a new technology quickly.",
        "What's your approach to mentoring junior developers?",
        "How do you stay updated with the latest industry trends?"
      ])
      setCurrentView('question-list')
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionSelect = (question) => {
    setSelectedQuestion(question)
    setCurrentView('answer-recorder')
  }

  const handleTranscriptComplete = async (transcript) => {
    setTranscript(transcript)
    setLoading(true)
    setError(null)
    
    try {
      console.log('Sending answer for analysis:', {
        jobDescription: jobData.jd,
        question: selectedQuestion,
        answer: transcript
      })
      
      const response = await fetch(API_ENDPOINTS.analyzeAnswer, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: jobData.jd,
          question: selectedQuestion,
          answer: transcript
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Analysis response:', data)

      setFeedback(data)
      setCurrentView('feedback')
    } catch (error) {
      console.error('Error analyzing answer:', error)
      setError(`Failed to analyze answer: ${error.message}`)
      
      // Fallback to mock feedback
      setFeedback({
        score: {
          clarity: 7,
          confidence: 6
        },
        missingKeywords: ['agile', 'scrum', 'stakeholder management'],
        improvements: [
          'Provide more specific examples with metrics',
          'Include more technical details about the solution',
          'Mention the business impact of your actions'
        ],
        idealAnswer: `I led a cross-functional team of 8 developers through a critical project that was behind schedule. 
        We implemented an agile approach with daily standups and bi-weekly sprints. I identified bottlenecks in our 
        development process and restructured our workflow, which improved our velocity by 40%. We delivered the 
        project on time and under budget, resulting in $500K in cost savings. The key was maintaining clear 
        communication with stakeholders and being adaptable when challenges arose.`
      })
      setCurrentView('feedback')
    } finally {
      setLoading(false)
    }
  }

  const handleStartOver = () => {
    setCurrentView('job-input')
    setJobData({ jd: '', role: '' })
    setQuestions([])
    setSelectedQuestion('')
    setTranscript('')
    setFeedback(null)
    setError(null)
  }

  const handleNextQuestion = () => {
    setCurrentView('question-list')
    setSelectedQuestion('')
    setTranscript('')
    setFeedback(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            InterviewIQ
          </h1>
          <p className="text-gray-600">
            AI-powered interview coaching with intelligent feedback
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Processing...</span>
          </div>
        )}

        {!loading && (
          <>
            {currentView === 'job-input' && (
              <JobInput onSubmit={handleJobSubmit} />
            )}

            {currentView === 'question-list' && (
              <QuestionList 
                questions={questions} 
                onQuestionSelect={handleQuestionSelect}
                onStartOver={handleStartOver}
              />
            )}

            {currentView === 'answer-recorder' && (
              <AnswerRecorder 
                question={selectedQuestion}
                onTranscriptComplete={handleTranscriptComplete}
                onBack={() => setCurrentView('question-list')}
              />
            )}

            {currentView === 'feedback' && (
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