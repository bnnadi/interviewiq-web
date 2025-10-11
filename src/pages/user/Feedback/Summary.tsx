import React from 'react'
import { useNavigate } from 'react-router-dom'
import FeedbackView from '@components/FeedbackView'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import { useAppContext } from '@context/AppContext'

const FeedbackSummary: React.FC = () => {
  const { 
    feedback, 
    transcript, 
    selectedQuestion, 
    handleNextQuestion, 
    handleStartOver 
  } = useAppContext()
  const navigate = useNavigate()

  if (!feedback) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            No Feedback Available
          </h1>
          <p className="text-gray-600 mb-6">
            Complete an interview session to see your feedback here.
          </p>
          <Button
            onClick={() => navigate('/practice')}
            className="px-6 py-2"
          >
            Start Practice Session
          </Button>
        </div>
      </div>
    )
  }

  const handleViewBodyLanguage = () => {
    navigate('/feedback/body')
  }

  const handleViewProgress = () => {
    navigate('/progress')
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Interview Feedback
        </h1>
        <p className="text-gray-600">
          Review your performance and get detailed insights to improve
        </p>
      </div>

      <Card className="p-6">
        <FeedbackView
          feedback={feedback}
          transcript={transcript}
          question={selectedQuestion}
          onNextQuestion={handleNextQuestion}
          onStartOver={handleStartOver}
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={handleViewBodyLanguage}
          variant="outline"
          className="px-6 py-3 h-full flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">👥</div>
            <div className="font-semibold">Body Language Analysis</div>
            <div className="text-sm text-gray-600">Review nonverbal feedback</div>
          </div>
        </Button>

        <Button
          onClick={handleViewProgress}
          variant="outline"
          className="px-6 py-3 h-full flex items-center justify-center"
        >
          <div className="text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-semibold">Progress Analytics</div>
            <div className="text-sm text-gray-600">View your improvement over time</div>
          </div>
        </Button>
      </div>

      <div className="flex justify-center space-x-4">
        <Button
          onClick={() => navigate('/practice')}
          variant="outline"
          className="px-6 py-2"
        >
          Practice Again
        </Button>
        <Button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}

export default FeedbackSummary
