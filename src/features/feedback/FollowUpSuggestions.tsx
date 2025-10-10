import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Button from '../../components/shared/ui/Button'

interface WeakArea {
  category: string
  score: number
  maxScore: number
  priority: 'high' | 'medium' | 'low'
  description: string
  suggestions: Suggestion[]
}

interface Suggestion {
  id: string
  title: string
  description: string
  type: 'practice' | 'technique' | 'preparation' | 'mindset'
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedTime: string
  resources?: {
    title: string
    url: string
    type: 'article' | 'video' | 'exercise' | 'tool'
  }[]
}

interface FollowUpSuggestionsProps {
  weakAreas?: WeakArea[]
  onSuggestionClick?: (suggestion: Suggestion) => void
  onResourceClick?: (resource: NonNullable<Suggestion['resources']>[0]) => void
  showProgress?: boolean
  maxSuggestions?: number
}

const FollowUpSuggestions: React.FC<FollowUpSuggestionsProps> = ({
  weakAreas = [],
  onSuggestionClick,
  onResourceClick,
  showProgress = true,
  maxSuggestions = 5
}) => {
  const [selectedArea, setSelectedArea] = useState<WeakArea | null>(null)
  const [completedSuggestions, setCompletedSuggestions] = useState<Set<string>>(new Set())

  // Sample weak areas if none provided
  const sampleWeakAreas: WeakArea[] = weakAreas.length > 0 ? weakAreas : [
    {
      category: 'Speaking Pace',
      score: 45,
      maxScore: 100,
      priority: 'high',
      description: 'You tend to speak too quickly, making it difficult for interviewers to follow your responses.',
      suggestions: [
        {
          id: 'pace-1',
          title: 'Practice with a Metronome',
          description: 'Use a metronome app set to 120 BPM to practice speaking at a steady pace.',
          type: 'practice',
          difficulty: 'easy',
          estimatedTime: '10 minutes daily',
          resources: [
            { title: 'Metronome App', url: '#', type: 'tool' },
            { title: 'Speaking Pace Guide', url: '#', type: 'article' }
          ]
        },
        {
          id: 'pace-2',
          title: 'Record and Review',
          description: 'Record yourself answering common questions and listen for pace issues.',
          type: 'practice',
          difficulty: 'medium',
          estimatedTime: '15 minutes daily',
          resources: [
            { title: 'Recording Tips', url: '#', type: 'article' }
          ]
        },
        {
          id: 'pace-3',
          title: 'Pause Technique',
          description: 'Practice inserting natural pauses between sentences and key points.',
          type: 'technique',
          difficulty: 'easy',
          estimatedTime: '5 minutes daily'
        }
      ]
    },
    {
      category: 'STAR Method Structure',
      score: 60,
      maxScore: 100,
      priority: 'high',
      description: 'Your responses lack clear structure. Focus on organizing thoughts using the STAR method.',
      suggestions: [
        {
          id: 'star-1',
          title: 'STAR Template Practice',
          description: 'Use a structured template to practice organizing your responses.',
          type: 'practice',
          difficulty: 'medium',
          estimatedTime: '20 minutes daily',
          resources: [
            { title: 'STAR Template', url: '#', type: 'tool' },
            { title: 'STAR Examples', url: '#', type: 'video' }
          ]
        },
        {
          id: 'star-2',
          title: 'Story Mapping',
          description: 'Map out your key experiences using the STAR framework before interviews.',
          type: 'preparation',
          difficulty: 'easy',
          estimatedTime: '30 minutes weekly'
        }
      ]
    },
    {
      category: 'Confidence & Presence',
      score: 55,
      maxScore: 100,
      priority: 'medium',
      description: 'Work on projecting confidence through voice tone and body language.',
      suggestions: [
        {
          id: 'conf-1',
          title: 'Power Posing',
          description: 'Practice confident body language and power poses before interviews.',
          type: 'technique',
          difficulty: 'easy',
          estimatedTime: '5 minutes daily',
          resources: [
            { title: 'Power Posing Guide', url: '#', type: 'video' }
          ]
        },
        {
          id: 'conf-2',
          title: 'Voice Projection',
          description: 'Practice speaking with authority and conviction in your voice.',
          type: 'practice',
          difficulty: 'medium',
          estimatedTime: '10 minutes daily'
        }
      ]
    },
    {
      category: 'Technical Examples',
      score: 70,
      maxScore: 100,
      priority: 'low',
      description: 'Include more specific technical details and quantifiable results in your examples.',
      suggestions: [
        {
          id: 'tech-1',
          title: 'Quantify Your Impact',
          description: 'Practice adding specific numbers and metrics to your achievements.',
          type: 'preparation',
          difficulty: 'easy',
          estimatedTime: '15 minutes weekly'
        }
      ]
    }
  ]

  // const getPriorityColor = (priority: WeakArea['priority']) => {
  //   switch (priority) {
  //     case 'high':
  //       return 'text-red-600 bg-red-100 border-red-200'
  //     case 'medium':
  //       return 'text-yellow-600 bg-yellow-100 border-yellow-200'
  //     case 'low':
  //       return 'text-green-600 bg-green-100 border-green-200'
  //     default:
  //       return 'text-gray-600 bg-gray-100 border-gray-200'
  //   }
  // }

  // const getDifficultyColor = (difficulty: Suggestion['difficulty']) => {
  //   switch (difficulty) {
  //     case 'easy':
  //       return 'text-green-600 bg-green-100'
  //     case 'medium':
  //       return 'text-yellow-600 bg-yellow-100'
  //     case 'hard':
  //       return 'text-red-600 bg-red-100'
  //     default:
  //       return 'text-gray-600 bg-gray-100'
  //   }
  // }

  const getTypeIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'practice':
        return '🏃‍♂️'
      case 'technique':
        return '🎯'
      case 'preparation':
        return '📚'
      case 'mindset':
        return '🧠'
      default:
        return '💡'
    }
  }

  const getResourceIcon = (type: NonNullable<Suggestion['resources']>[0]['type']) => {
    switch (type) {
      case 'article':
        return '📄'
      case 'video':
        return '🎥'
      case 'exercise':
        return '💪'
      case 'tool':
        return '🛠️'
      default:
        return '🔗'
    }
  }

  const handleSuggestionComplete = (suggestionId: string) => {
    setCompletedSuggestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId)
      } else {
        newSet.add(suggestionId)
      }
      return newSet
    })
  }

  const sortedWeakAreas = [...sampleWeakAreas].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold text-gray-900">Follow-up Suggestions</h3>
          <p className="text-gray-600">Personalized recommendations to improve your interview performance</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedWeakAreas.slice(0, maxSuggestions).map((area, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedArea?.category === area.category
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setSelectedArea(area)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{area.category}</h4>
                      <Badge
                        variant={area.priority === 'high' ? 'destructive' : area.priority === 'medium' ? 'warning' : 'success'}
                        size="sm"
                      >
                        {area.priority} priority
                      </Badge>
                      <div className="text-sm text-gray-600">
                        {area.score}/{area.maxScore} ({Math.round((area.score / area.maxScore) * 100)}%)
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{area.description}</p>
                    
                    {/* Quick suggestions preview */}
                    <div className="flex flex-wrap gap-2">
                      {area.suggestions.slice(0, 2).map((suggestion) => (
                        <Badge
                          key={suggestion.id}
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-1"
                        >
                          <span>{getTypeIcon(suggestion.type)}</span>
                          <span>{suggestion.title}</span>
                        </Badge>
                      ))}
                      {area.suggestions.length > 2 && (
                        <Badge variant="outline" size="sm">
                          +{area.suggestions.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-700">
                        {Math.round((area.score / area.maxScore) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Suggestions for Selected Area */}
      {selectedArea && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">
                Detailed Suggestions for {selectedArea.category}
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedArea(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedArea.suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-4 rounded-lg border transition-all ${
                    completedSuggestions.has(suggestion.id)
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
                        <h5 className="font-semibold text-gray-900">{suggestion.title}</h5>
                        <Badge
                          variant={suggestion.difficulty === 'easy' ? 'success' : suggestion.difficulty === 'medium' ? 'warning' : 'destructive'}
                          size="sm"
                        >
                          {suggestion.difficulty}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{suggestion.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>⏱️ {suggestion.estimatedTime}</span>
                        <span>📊 {suggestion.type}</span>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button
                        variant={completedSuggestions.has(suggestion.id) ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => {
                          handleSuggestionComplete(suggestion.id)
                          onSuggestionClick?.(suggestion)
                        }}
                      >
                        {completedSuggestions.has(suggestion.id) ? 'Completed' : 'Start'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Resources */}
                  {suggestion.resources && suggestion.resources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h6 className="text-sm font-medium text-gray-700 mb-2">Resources:</h6>
                      <div className="flex flex-wrap gap-2">
                        {suggestion.resources.map((resource, index) => (
                          <button
                            key={index}
                            onClick={() => onResourceClick?.(resource)}
                            className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                          >
                            <span>{getResourceIcon(resource.type)}</span>
                            <span>{resource.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Summary */}
      {showProgress && (
        <Card>
          <CardHeader>
            <h4 className="text-lg font-semibold text-gray-900">Your Progress</h4>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {completedSuggestions.size}
                </div>
                <div className="text-sm text-gray-600">Suggestions Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((completedSuggestions.size / sampleWeakAreas.reduce((sum, area) => sum + area.suggestions.length, 0)) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {sampleWeakAreas.length}
                </div>
                <div className="text-sm text-gray-600">Areas to Improve</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FollowUpSuggestions
