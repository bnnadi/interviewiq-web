import React from 'react'
import { useNavigate } from 'react-router-dom'
import QuestionList from '@components/QuestionList'
import AnswerRecorder from '@components/AnswerRecorder'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import { useAppContext } from '@context/AppContext'

const PracticeLive: React.FC = () => {
  const { 
    questions, 
    selectedQuestion, 
    handleQuestionSelect, 
    handleTranscriptComplete,
    handleStartOver 
  } = useAppContext()
  const navigate = useNavigate()

  const handleBack = () => {
    navigate('/practice')
  }

  const handleFinishInterview = () => {
    navigate('/feedback/summary')
  }

  // If no question is selected, show the question list
  if (!selectedQuestion) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Live Interview Practice
          </h1>
          <p className="text-gray-600">
            Select a question to begin your practice session
          </p>
        </div>

        <Card className="p-6">
          <QuestionList
            questions={questions}
            onQuestionSelect={handleQuestionSelect}
            onStartOver={handleStartOver}
          />
        </Card>

        <div className="flex justify-center">
          <Button
            onClick={handleBack}
            variant="outline"
            className="px-6 py-2"
          >
            ← Back to Scenarios
          </Button>
        </div>
      </div>
    )
  }

  // If a question is selected, show the recording interface
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Live Interview Practice
        </h1>
        <p className="text-gray-600">
          Answer the question naturally, as you would in a real interview
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

export default PracticeLive
