import React from 'react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

interface ScoreData {
  category: string
  score: number // 0-100
  maxScore: number
  color: string
  description: string
  subScores?: {
    label: string
    score: number
  }[]
}

interface ScoreDialsProps {
  scores: ScoreData[]
  showSubScores?: boolean
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
  showLabels?: boolean
}

const ScoreDials: React.FC<ScoreDialsProps> = ({
  scores = [],
  showSubScores = true,
  size = 'md',
  animated = true,
  showLabels = true
}) => {
  // Sample data if none provided
  const sampleScores: ScoreData[] = scores.length > 0 ? scores : [
    {
      category: 'Verbal Communication',
      score: 85,
      maxScore: 100,
      color: 'text-blue-600',
      description: 'Clear articulation and effective word choice',
      subScores: [
        { label: 'Clarity', score: 90 },
        { label: 'Pace', score: 80 },
        { label: 'Vocabulary', score: 85 },
        { label: 'Grammar', score: 88 }
      ]
    },
    {
      category: 'Non-verbal Communication',
      score: 72,
      maxScore: 100,
      color: 'text-green-600',
      description: 'Good eye contact and body language',
      subScores: [
        { label: 'Eye Contact', score: 75 },
        { label: 'Posture', score: 70 },
        { label: 'Gestures', score: 68 },
        { label: 'Facial Expressions', score: 75 }
      ]
    },
    {
      category: 'Content Quality',
      score: 78,
      maxScore: 100,
      color: 'text-purple-600',
      description: 'Well-structured responses with relevant examples',
      subScores: [
        { label: 'Structure', score: 80 },
        { label: 'Relevance', score: 75 },
        { label: 'Examples', score: 82 },
        { label: 'Depth', score: 75 }
      ]
    },
    {
      category: 'Confidence',
      score: 88,
      maxScore: 100,
      color: 'text-orange-600',
      description: 'Demonstrates strong self-assurance',
      subScores: [
        { label: 'Voice Tone', score: 90 },
        { label: 'Assertiveness', score: 85 },
        { label: 'Composure', score: 88 },
        { label: 'Enthusiasm', score: 90 }
      ]
    }
  ]

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-32 h-32',
          text: 'text-lg',
          subText: 'text-xs',
          strokeWidth: 8
        }
      case 'lg':
        return {
          container: 'w-48 h-48',
          text: 'text-3xl',
          subText: 'text-lg',
          strokeWidth: 12
        }
      default: // md
        return {
          container: 'w-40 h-40',
          text: 'text-2xl',
          subText: 'text-sm',
          strokeWidth: 10
        }
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-400 to-green-600'
    if (score >= 60) return 'from-yellow-400 to-yellow-600'
    if (score >= 40) return 'from-orange-400 to-orange-600'
    return 'from-red-400 to-red-600'
  }

  const CircularProgress: React.FC<{
    score: number
    maxScore: number
    color: string
    size: 'sm' | 'md' | 'lg'
    animated: boolean
  }> = ({ score, maxScore, color, size, animated }) => {
    const sizeClasses = getSizeClasses(size)
    const percentage = (score / maxScore) * 100
    const radius = size === 'sm' ? 56 : size === 'lg' ? 88 : 72
    const circumference = 2 * Math.PI * radius
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div className={`relative ${sizeClasses.container}`}>
        <svg
          className="transform -rotate-90 w-full h-full"
          viewBox={`0 0 ${(radius + sizeClasses.strokeWidth) * 2} ${(radius + sizeClasses.strokeWidth) * 2}`}
        >
          {/* Background circle */}
          <circle
            cx={radius + sizeClasses.strokeWidth}
            cy={radius + sizeClasses.strokeWidth}
            r={radius}
            stroke="currentColor"
            strokeWidth={sizeClasses.strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx={radius + sizeClasses.strokeWidth}
            cy={radius + sizeClasses.strokeWidth}
            r={radius}
            stroke="currentColor"
            strokeWidth={sizeClasses.strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={`${color} transition-all duration-1000 ease-in-out ${
              animated ? 'animate-pulse' : ''
            }`}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-bold ${sizeClasses.text} ${getScoreColor(score)}`}>
            {score}
          </div>
          <div className={`text-gray-500 ${sizeClasses.subText}`}>
            /{maxScore}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold text-gray-900">Performance Scores</h3>
          <p className="text-gray-600">Detailed breakdown of your interview performance</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sampleScores.map((scoreData, index) => (
              <div key={index} className="text-center space-y-4">
                {/* Circular Progress */}
                <div className="flex justify-center">
                  <CircularProgress
                    score={scoreData.score}
                    maxScore={scoreData.maxScore}
                    color={scoreData.color}
                    size={size}
                    animated={animated}
                  />
                </div>

                {/* Category Info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-900">{scoreData.category}</h4>
                  {showLabels && (
                    <p className="text-sm text-gray-600">{scoreData.description}</p>
                  )}
                  
                  {/* Overall Score Badge */}
                  <Badge
                    variant={scoreData.score >= 80 ? 'success' : scoreData.score >= 60 ? 'warning' : 'destructive'}
                    size="sm"
                  >
                    {scoreData.score}%
                  </Badge>
                </div>

                {/* Sub-scores */}
                {showSubScores && scoreData.subScores && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Breakdown:</h5>
                    <div className="space-y-1">
                      {scoreData.subScores.map((subScore, subIndex) => (
                        <div key={subIndex} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{subScore.label}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full bg-gradient-to-r ${getScoreGradient(subScore.score)} transition-all duration-500`}
                                style={{ width: `${subScore.score}%` }}
                              />
                            </div>
                            <span className={`font-medium ${getScoreColor(subScore.score)}`}>
                              {subScore.score}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overall Performance Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Overall Performance</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                <div className="text-3xl font-bold text-gray-900">
                  {Math.round(sampleScores.reduce((sum, score) => sum + score.score, 0) / sampleScores.length)}%
                </div>
                <Badge
                  variant={
                    Math.round(sampleScores.reduce((sum, score) => sum + score.score, 0) / sampleScores.length) >= 80
                      ? 'success'
                      : Math.round(sampleScores.reduce((sum, score) => sum + score.score, 0) / sampleScores.length) >= 60
                      ? 'warning'
                      : 'destructive'
                  }
                  size="lg"
                >
                  {Math.round(sampleScores.reduce((sum, score) => sum + score.score, 0) / sampleScores.length) >= 80
                    ? 'Excellent'
                    : Math.round(sampleScores.reduce((sum, score) => sum + score.score, 0) / sampleScores.length) >= 60
                    ? 'Good'
                    : 'Needs Improvement'}
                </Badge>
              </div>
              <p className="text-gray-600">
                Average score across all categories
              </p>
            </div>
            
            {/* Performance Insights */}
            <div className="text-right space-y-1">
              <div className="text-sm text-gray-600">Strongest Area:</div>
              <div className="font-medium text-green-600">
                {sampleScores.reduce((max, score) => score.score > max.score ? score : max).category}
              </div>
              <div className="text-sm text-gray-600">Needs Work:</div>
              <div className="font-medium text-red-600">
                {sampleScores.reduce((min, score) => score.score < min.score ? score : min).category}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ScoreDials
