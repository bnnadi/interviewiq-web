import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'

interface STARProgress {
  situation: {
    completed: boolean
    progress: number // 0-100
    keywords: string[]
    detected: string[]
  }
  task: {
    completed: boolean
    progress: number
    keywords: string[]
    detected: string[]
  }
  action: {
    completed: boolean
    progress: number
    keywords: string[]
    detected: string[]
  }
  result: {
    completed: boolean
    progress: number
    keywords: string[]
    detected: string[]
  }
}

interface STARHelperProps {
  currentProgress?: STARProgress
  isActive?: boolean
  onProgressUpdate?: (progress: STARProgress) => void
  showTips?: boolean
  autoDetect?: boolean
}

const STARHelper: React.FC<STARHelperProps> = ({
  currentProgress,
  isActive = true,
  onProgressUpdate,
  showTips = true,
  autoDetect = true
}) => {
  const [progress, setProgress] = useState<STARProgress>(
    currentProgress || {
      situation: { completed: false, progress: 0, keywords: ['when', 'where', 'context', 'background'], detected: [] },
      task: { completed: false, progress: 0, keywords: ['responsibility', 'goal', 'objective', 'challenge'], detected: [] },
      action: { completed: false, progress: 0, keywords: ['what', 'how', 'steps', 'approach', 'solution'], detected: [] },
      result: { completed: false, progress: 0, keywords: ['outcome', 'impact', 'learned', 'achieved', 'result'], detected: [] }
    }
  )

  const [currentPhase, setCurrentPhase] = useState<'situation' | 'task' | 'action' | 'result'>('situation')
  const [tips, setTips] = useState<string[]>([])

  // Sample tips for each phase
  const phaseTips = {
    situation: [
      "Set the context clearly - when and where did this happen?",
      "Describe the background and circumstances",
      "Keep it concise but informative",
      "Use phrases like 'In my previous role...' or 'Last year at...'"
    ],
    task: [
      "Explain what you were responsible for",
      "Describe the challenge or goal you faced",
      "Be specific about your role and expectations",
      "Use phrases like 'My responsibility was...' or 'The challenge was...'"
    ],
    action: [
      "Focus on what YOU did, not the team",
      "Describe your specific steps and approach",
      "Include your thought process and decision-making",
      "Use action verbs like 'I implemented...', 'I developed...', 'I created...'"
    ],
    result: [
      "Quantify the impact with numbers if possible",
      "Explain what you learned from the experience",
      "Connect it to the job you're applying for",
      "Use phrases like 'As a result...', 'This led to...', 'I learned...'"
    ]
  }

  // Extract keyword detection logic
  const detectKeyword = useCallback((phase: keyof STARProgress, phaseData: STARProgress[keyof STARProgress]) => {
    if (phaseData.completed) return null
    
    const availableKeywords = phaseData.keywords.filter(keyword => !phaseData.detected.includes(keyword))
    if (availableKeywords.length === 0) return null
    
    const randomKeyword = availableKeywords[Math.floor(Math.random() * availableKeywords.length)]
    const newDetected = [...phaseData.detected, randomKeyword]
    const newProgress = Math.min(100, (newDetected.length / phaseData.keywords.length) * 100)
    
    return {
      detected: newDetected,
      progress: newProgress,
      completed: newProgress >= 80
    }
  }, [])

  // Extract progress update logic
  const updatePhaseProgress = useCallback((phase: keyof STARProgress, phaseData: STARProgress[keyof STARProgress]) => {
    const detection = detectKeyword(phase, phaseData)
    if (!detection) return phaseData
    
    return {
      ...phaseData,
      detected: detection.detected,
      progress: detection.progress,
      completed: detection.completed
    }
  }, [detectKeyword])

  useEffect(() => {
    if (!autoDetect) return undefined
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const phases = ['situation', 'task', 'action', 'result'] as const
        const newProgress = { ...prev }
        
        phases.forEach(phase => {
          newProgress[phase] = updatePhaseProgress(phase, prev[phase])
        })
        
        onProgressUpdate?.(newProgress)
        return newProgress
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [autoDetect, onProgressUpdate, updatePhaseProgress])

  // Extract phase update logic
  const updateCurrentPhase = useCallback((progress: STARProgress) => {
    const phases = ['situation', 'task', 'action', 'result'] as const
    const nextPhase = phases.find(phase => !progress[phase].completed) || 'result'
    return nextPhase
  }, [])

  useEffect(() => {
    const nextPhase = updateCurrentPhase(progress)
    setCurrentPhase(nextPhase)
    setTips(phaseTips[nextPhase])
  }, [progress, updateCurrentPhase])

  const getPhaseIcon = (phase: keyof STARProgress) => {
    const icons = {
      situation: '📍',
      task: '🎯',
      action: '⚡',
      result: '🏆'
    }
    return icons[phase]
  }

  // const getPhaseColor = (phase: keyof STARProgress) => {
  //   if (progress[phase].completed) return 'text-green-600 bg-green-100'
  //   if (phase === currentPhase) return 'text-blue-600 bg-blue-100'
  //   return 'text-gray-600 bg-gray-100'
  // }

  // Extract progress calculation logic
  const phases = ['situation', 'task', 'action', 'result'] as const
  
  const getOverallProgress = useCallback(() => {
    const totalProgress = phases.reduce((sum, phase) => sum + progress[phase].progress, 0)
    return totalProgress / phases.length
  }, [progress])

  const getCompletedPhases = useCallback(() => {
    return phases.filter(phase => progress[phase].completed).length
  }, [progress])

  // Extract reset logic
  const resetProgress = useCallback(() => {
    setProgress({
      situation: { completed: false, progress: 0, keywords: ['when', 'where', 'context', 'background'], detected: [] },
      task: { completed: false, progress: 0, keywords: ['responsibility', 'goal', 'objective', 'challenge'], detected: [] },
      action: { completed: false, progress: 0, keywords: ['what', 'how', 'steps', 'approach', 'solution'], detected: [] },
      result: { completed: false, progress: 0, keywords: ['outcome', 'impact', 'learned', 'achieved', 'result'], detected: [] }
    })
    setCurrentPhase('situation')
  }, [])

  if (!isActive) return null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">STAR Method Helper</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="default" size="sm">
                {getCompletedPhases()}/4 Complete
              </Badge>
              <Badge variant={getOverallProgress() >= 80 ? 'success' : 'warning'} size="sm">
                {Math.round(getOverallProgress())}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Overall Progress</span>
                <span className="text-gray-600">{Math.round(getOverallProgress())}%</span>
              </div>
              <ProgressBar
                value={getOverallProgress()}
                variant={getOverallProgress() >= 80 ? 'success' : 'default'}
                size="md"
              />
            </div>

            {/* STAR Phases */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(['situation', 'task', 'action', 'result'] as const).map((phase) => (
                <div
                  key={phase}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    progress[phase].completed
                      ? 'border-green-500 bg-green-50'
                      : phase === currentPhase
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="text-center space-y-3">
                    <div className="text-2xl">{getPhaseIcon(phase)}</div>
                    <div>
                      <h4 className="font-semibold capitalize text-gray-900">{phase}</h4>
                      <div className="text-sm text-gray-600">
                        {progress[phase].progress.toFixed(0)}% complete
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <ProgressBar
                      value={progress[phase].progress}
                      variant={progress[phase].completed ? 'success' : 'default'}
                      size="sm"
                    />
                    
                    {/* Keywords */}
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">Keywords detected:</div>
                      <div className="flex flex-wrap gap-1">
                        {progress[phase].detected.map((keyword, index) => (
                          <Badge key={index} variant="success" size="sm">
                            {keyword}
                          </Badge>
                        ))}
                        {progress[phase].keywords
                          .filter(kw => !progress[phase].detected.includes(kw))
                          .slice(0, 2)
                          .map((keyword, index) => (
                            <Badge key={index} variant="outline" size="sm">
                              {keyword}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Phase Tips */}
            {showTips && tips.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <span className="mr-2">💡</span>
                  Tips for {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} Phase
                </h4>
                <ul className="space-y-2">
                  {tips.map((tip, index) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setProgress(prev => ({
                    ...prev,
                    [currentPhase]: {
                      ...prev[currentPhase],
                      progress: Math.min(100, prev[currentPhase].progress + 25),
                      completed: prev[currentPhase].progress + 25 >= 80
                    }
                  }))
                }}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Mark {currentPhase} complete
              </button>
              <button
                onClick={resetProgress}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Reset Progress
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default STARHelper
