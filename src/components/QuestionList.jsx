import React from 'react'
import Button from './ui/Button.jsx'

const QuestionList = React.memo(function QuestionList({ questions, onQuestionSelect, onStartOver }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Interview Questions
          </h2>
          <button
            onClick={onStartOver}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Start Over
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Here are personalized interview questions based on your job description. 
          Click "Start Answering" to practice with any question.
        </p>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-sm font-medium rounded-full mr-3">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-medium text-gray-900">
                      Question {index + 1}
                    </h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {question}
                  </p>
                </div>
                <Button
                  onClick={() => onQuestionSelect(question)}
                  variant="primary"
                  size="sm"
                  className="ml-4 whitespace-nowrap"
                >
                  Start Answering
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-green-50 rounded-md">
          <h3 className="text-sm font-medium text-green-900 mb-2">🎯 Practice Tips</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Start with questions you feel most confident about</li>
            <li>• Use the STAR method (Situation, Task, Action, Result) for behavioral questions</li>
            <li>• Practice speaking clearly and at a measured pace</li>
            <li>• Include specific examples and metrics when possible</li>
          </ul>
        </div>
      </div>
    </div>
  )
})

export default QuestionList 