import React from 'react'

function FeedbackView({ feedback, transcript, question, onNextQuestion, onStartOver }) {
  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score) => {
    if (score >= 8) return 'Excellent'
    if (score >= 6) return 'Good'
    return 'Needs Improvement'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            AI Feedback
          </h2>
          <button
            onClick={onStartOver}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
          >
            Start Over
          </button>
        </div>

        {/* Question and Transcript */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Question:</h3>
            <p className="text-blue-800">{question}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Your Answer:</h3>
            <p className="text-gray-800">{transcript}</p>
          </div>
        </div>

        {/* Score */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Overall Score
              </h3>
              <p className="text-gray-600">
                Based on clarity, relevance, and alignment with job requirements
              </p>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(feedback.score)}`}>
                {feedback.score}/10
              </div>
              <div className={`text-sm font-medium ${getScoreColor(feedback.score)}`}>
                {getScoreLabel(feedback.score)}
              </div>
            </div>
          </div>
        </div>

        {/* Missing Keywords */}
        {feedback.missingKeywords && feedback.missingKeywords.length > 0 && (
          <div className="mb-8 p-6 bg-red-50 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-3">
              Missing Keywords from Job Description
            </h3>
            <div className="flex flex-wrap gap-2">
              {feedback.missingKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
            <p className="text-red-700 text-sm mt-3">
              Consider incorporating these keywords naturally into your future answers to better align with the job requirements.
            </p>
          </div>
        )}

        {/* Improvements */}
        <div className="mb-8 p-6 bg-yellow-50 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">
            Suggested Improvements
          </h3>
          <ul className="space-y-2">
            {feedback.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-600 mr-2 mt-1">•</span>
                <span className="text-yellow-800">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ideal Answer */}
        <div className="mb-8 p-6 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            Ideal Answer Example
          </h3>
          <div className="bg-white p-4 rounded border border-green-200">
            <p className="text-green-800 leading-relaxed whitespace-pre-line">
              {feedback.idealAnswer}
            </p>
          </div>
          <p className="text-green-700 text-sm mt-3">
            This example demonstrates how to incorporate relevant keywords, provide specific examples, and structure your response effectively.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={onNextQuestion}
            className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Practice Another Question
          </button>
          
          <button
            onClick={onStartOver}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Start Over
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-purple-50 rounded-md">
          <h3 className="text-sm font-medium text-purple-900 mb-2">💡 Next Steps</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Practice the same question again with the feedback in mind</li>
            <li>• Try other questions to build confidence</li>
            <li>• Focus on incorporating missing keywords naturally</li>
            <li>• Use the STAR method consistently</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default FeedbackView 