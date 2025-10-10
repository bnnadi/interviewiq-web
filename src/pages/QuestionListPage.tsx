import React from 'react'
import QuestionList from '../components/QuestionList'
import { useAppContext } from '../context/AppContext'

const QuestionListPage: React.FC = () => {
  const { questions, handleQuestionSelect, handleStartOver } = useAppContext()
  
  return (
    <QuestionList
      questions={questions}
      onQuestionSelect={handleQuestionSelect}
      onStartOver={handleStartOver}
    />
  )
}

export default QuestionListPage
