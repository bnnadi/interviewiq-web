import React from 'react'
import FeedbackView from '../components/FeedbackView'
import { useAppContext } from '../context/AppContext'

const FeedbackPage: React.FC = () => {
  const { feedback, transcript, selectedQuestion, handleNextQuestion, handleStartOver } = useAppContext()

  if (!feedback) {
    return <div>No feedback available</div>
  }

  return (
    <FeedbackView
      feedback={feedback}
      transcript={transcript}
      question={selectedQuestion}
      onNextQuestion={handleNextQuestion}
      onStartOver={handleStartOver}
    />
  )
}

export default FeedbackPage
