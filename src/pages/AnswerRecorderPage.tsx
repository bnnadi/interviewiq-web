import React from 'react'
import { useNavigate } from 'react-router-dom'
import AnswerRecorder from '../components/AnswerRecorder'
import { useAppContext } from '../context/AppContext'

const AnswerRecorderPage: React.FC = () => {
  const { selectedQuestion, handleTranscriptComplete } = useAppContext()
  const navigate = useNavigate()

  const handleBack = () => {
    navigate('/interview/questions')
  }

  return (
    <AnswerRecorder
      question={selectedQuestion}
      onTranscriptComplete={handleTranscriptComplete}
      onBack={handleBack}
    />
  )
}

export default AnswerRecorderPage
