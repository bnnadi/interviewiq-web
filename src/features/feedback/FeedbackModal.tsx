import React, { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'
import Button from '../../components/shared/ui/Button'

interface RubricScore {
  category: string
  score: number
  maxScore: number
  description: string
  criteria: {
    label: string
    score: number
    maxScore: number
    feedback: string
  }[]
}

interface SessionSummary {
  overallScore: number
  maxScore: number
  duration: number
  questionsAnswered: number
  totalQuestions: number
  strengths: string[]
  improvements: string[]
  rubricScores: RubricScore[]
  timestamp: string
  jobTitle?: string
  company?: string
}

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  sessionData?: SessionSummary
  onRetakeInterview?: () => void
  onViewDetailedFeedback?: () => void
  onDownloadReport?: () => void
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  sessionData,
  onRetakeInterview,
  onViewDetailedFeedback,
  onDownloadReport
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'recommendations'>('overview')

  // Sample session data if none provided
  const sampleSessionData: SessionSummary = sessionData || {
    overallScore: 78,
    maxScore: 100,
    duration: 1245, // 20 minutes 45 seconds
    questionsAnswered: 6,
    totalQuestions: 8,
    strengths: [
      'Clear communication and articulation',
      'Good use of STAR method in responses',
      'Demonstrated technical knowledge',
      'Maintained professional demeanor'
    ],
    improvements: [
      'Speak at a more consistent pace',
      'Provide more specific examples with metrics',
      'Ask clarifying questions when needed',
      'Improve eye contact during responses'
    ],
    rubricScores: [
      {
        category: 'Communication Skills',
        score: 82,
        maxScore: 100,
        description: 'Verbal and non-verbal communication effectiveness',
        criteria: [
          {
            label: 'Clarity of Speech',
            score: 85,
            maxScore: 100,
            feedback: 'Clear articulation with minor pace inconsistencies'
          },
          {
            label: 'Body Language',
            score: 78,
            maxScore: 100,
            feedback: 'Good posture but could improve eye contact'
          },
          {
            label: 'Listening Skills',
            score: 80,
            maxScore: 100,
            feedback: 'Demonstrated active listening throughout'
          }
        ]
      },
      {
        category: 'Technical Knowledge',
        score: 75,
        maxScore: 100,
        description: 'Demonstration of relevant technical skills and knowledge',
        criteria: [
          {
            label: 'Technical Accuracy',
            score: 80,
            maxScore: 100,
            feedback: 'Accurate technical explanations with good depth'
          },
          {
            label: 'Problem Solving',
            score: 70,
            maxScore: 100,
            feedback: 'Logical approach but could be more systematic'
          },
          {
            label: 'Industry Knowledge',
            score: 75,
            maxScore: 100,
            feedback: 'Good understanding of current trends and practices'
          }
        ]
      },
      {
        category: 'Behavioral Responses',
        score: 80,
        maxScore: 100,
        description: 'Quality of behavioral and situational responses',
        criteria: [
          {
            label: 'STAR Method Usage',
            score: 85,
            maxScore: 100,
            feedback: 'Well-structured responses using STAR framework'
          },
          {
            label: 'Example Quality',
            score: 75,
            maxScore: 100,
            feedback: 'Good examples but could include more metrics'
          },
          {
            label: 'Relevance',
            score: 80,
            maxScore: 100,
            feedback: 'Examples were relevant to the questions asked'
          }
        ]
      },
      {
        category: 'Confidence & Presence',
        score: 76,
        maxScore: 100,
        description: 'Overall confidence and professional presence',
        criteria: [
          {
            label: 'Self-Assurance',
            score: 78,
            maxScore: 100,
            feedback: 'Confident delivery with room for improvement'
          },
          {
            label: 'Enthusiasm',
            score: 80,
            maxScore: 100,
            feedback: 'Demonstrated genuine interest and enthusiasm'
          },
          {
            label: 'Composure',
            score: 70,
            maxScore: 100,
            feedback: 'Maintained composure with minor nervousness'
          }
        ]
      }
    ],
    timestamp: '2024-01-28T14:30:00Z',
    jobTitle: 'Senior Software Engineer',
    company: 'Tech Corp'
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    if (percentage >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreVariant = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 80) return 'success'
    if (percentage >= 60) return 'warning'
    return 'error'
  }

  const getOverallRating = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 90) return { label: 'Excellent', color: 'text-green-600' }
    if (percentage >= 80) return { label: 'Good', color: 'text-blue-600' }
    if (percentage >= 70) return { label: 'Satisfactory', color: 'text-yellow-600' }
    if (percentage >= 60) return { label: 'Needs Improvement', color: 'text-orange-600' }
    return { label: 'Poor', color: 'text-red-600' }
  }

  const overallRating = getOverallRating(sampleSessionData.overallScore, sampleSessionData.maxScore)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Interview Session Summary"
      className="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {sampleSessionData.jobTitle} Interview
              </h2>
              <p className="text-gray-600">{sampleSessionData.company}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {sampleSessionData.overallScore}/{sampleSessionData.maxScore}
              </div>
              <div className={`text-lg font-semibold ${overallRating.color}`}>
                {overallRating.label}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{formatDuration(sampleSessionData.duration)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Questions:</span>
              <span className="font-medium">
                {sampleSessionData.questionsAnswered}/{sampleSessionData.totalQuestions}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {new Date(sampleSessionData.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'detailed', label: 'Detailed Feedback' },
            { id: 'recommendations', label: 'Recommendations' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overall Score */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Overall Performance</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Overall Score</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-2xl font-bold ${getScoreColor(sampleSessionData.overallScore, sampleSessionData.maxScore)}`}>
                        {sampleSessionData.overallScore}%
                      </span>
                      <Badge variant={getScoreVariant(sampleSessionData.overallScore, sampleSessionData.maxScore)}>
                        {overallRating.label}
                      </Badge>
                    </div>
                  </div>
                  <ProgressBar
                    value={sampleSessionData.overallScore}
                    max={sampleSessionData.maxScore}
                    variant={getScoreVariant(sampleSessionData.overallScore, sampleSessionData.maxScore)}
                    size="lg"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-green-700">Strengths</h3>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {sampleSessionData.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-sm text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-orange-700">Areas for Improvement</h3>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {sampleSessionData.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span className="text-sm text-gray-700">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'detailed' && (
          <div className="space-y-6">
            {sampleSessionData.rubricScores.map((rubric, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{rubric.category}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xl font-bold ${getScoreColor(rubric.score, rubric.maxScore)}`}>
                        {rubric.score}%
                      </span>
                      <Badge variant={getScoreVariant(rubric.score, rubric.maxScore)}>
                        {Math.round((rubric.score / rubric.maxScore) * 100)}%
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{rubric.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ProgressBar
                      value={rubric.score}
                      max={rubric.maxScore}
                      variant={getScoreVariant(rubric.score, rubric.maxScore)}
                      size="md"
                    />
                    <div className="space-y-3">
                      {rubric.criteria.map((criterion, criterionIndex) => (
                        <div key={criterionIndex} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{criterion.label}</span>
                            <span className={`text-sm font-medium ${getScoreColor(criterion.score, criterion.maxScore)}`}>
                              {criterion.score}/{criterion.maxScore}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                              className={`h-2 rounded-full ${
                                (criterion.score / criterion.maxScore) >= 0.8
                                  ? 'bg-green-500'
                                  : (criterion.score / criterion.maxScore) >= 0.6
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${(criterion.score / criterion.maxScore) * 100}%` }}
                            />
                          </div>
                          <p className="text-sm text-gray-600">{criterion.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Next Steps</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Immediate Actions</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• Practice speaking at a consistent pace using a metronome</li>
                      <li>• Prepare 3-5 STAR examples with specific metrics</li>
                      <li>• Record yourself answering common questions</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Long-term Development</h4>
                    <ul className="space-y-1 text-sm text-green-800">
                      <li>• Join a public speaking group or toastmasters</li>
                      <li>• Practice mock interviews weekly</li>
                      <li>• Study industry-specific interview questions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
          <Button
            variant="primary"
            onClick={() => {
              onViewDetailedFeedback?.()
              onClose()
            }}
          >
            View Detailed Feedback
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onRetakeInterview?.()
              onClose()
            }}
          >
            Retake Interview
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onDownloadReport?.()
            }}
          >
            Download Report
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default FeedbackModal
