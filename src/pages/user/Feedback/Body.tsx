import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import { Badge } from '@components/ui/Badge'
import { ProgressBar } from '@components/ui/ProgressBar'

const FeedbackBody: React.FC = () => {
  const navigate = useNavigate()

  // Mock data for body language analysis
  const bodyLanguageMetrics = {
    eyeContact: 85,
    posture: 78,
    gestures: 92,
    facialExpressions: 88,
    overall: 83
  }

  const feedback = [
    {
      category: 'Eye Contact',
      score: bodyLanguageMetrics.eyeContact,
      feedback: 'Good eye contact maintained throughout. Consider looking at the camera more consistently.',
      improvement: 'Look directly at the camera when speaking to create better connection with the interviewer.'
    },
    {
      category: 'Posture',
      score: bodyLanguageMetrics.posture,
      feedback: 'Generally good posture, but occasionally slouched. Keep your back straight and shoulders back.',
      improvement: 'Practice sitting up straight with your shoulders back and chest open.'
    },
    {
      category: 'Gestures',
      score: bodyLanguageMetrics.gestures,
      feedback: 'Excellent use of hand gestures to emphasize points. Natural and engaging.',
      improvement: 'Continue using natural gestures, but avoid over-gesturing which can be distracting.'
    },
    {
      category: 'Facial Expressions',
      score: bodyLanguageMetrics.facialExpressions,
      feedback: 'Appropriate facial expressions that match your tone. Good use of smiles.',
      improvement: 'Maintain a warm, confident expression throughout the interview.'
    }
  ]

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreVariant = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 85) return 'success'
    if (score >= 70) return 'warning'
    return 'error'
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Body Language Analysis
        </h1>
        <p className="text-gray-600">
          Detailed feedback on your nonverbal communication during the interview
        </p>
      </div>

      {/* Overall Score */}
      <Card className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Overall Body Language Score</h2>
          <div className={`text-5xl font-bold ${getScoreColor(bodyLanguageMetrics.overall)} mb-2`}>
            {bodyLanguageMetrics.overall}/100
          </div>
          <ProgressBar 
            value={bodyLanguageMetrics.overall} 
            className="w-full max-w-md mx-auto"
          />
        </div>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {feedback.map((item, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{item.category}</h3>
              <Badge variant={getScoreVariant(item.score)}>
                {item.score}/100
              </Badge>
            </div>
            
            <ProgressBar value={item.score} className="mb-4" />
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Current Performance</h4>
                <p className="text-sm text-gray-600">{item.feedback}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Improvement Tip</h4>
                <p className="text-sm text-blue-600">{item.improvement}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Action Items */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">🎯 Action Items</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Practice maintaining eye contact with the camera for 5-10 minutes daily</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Record yourself answering questions to monitor posture</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Practice using natural hand gestures in front of a mirror</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Work on maintaining a confident, warm facial expression</span>
          </li>
        </ul>
      </Card>

      {/* Navigation */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={() => navigate('/feedback/summary')}
          variant="outline"
          className="px-6 py-2"
        >
          ← Back to Summary
        </Button>
        <Button
          onClick={() => navigate('/practice')}
          className="px-6 py-2"
        >
          Practice Again
        </Button>
      </div>
    </div>
  )
}

export default FeedbackBody
