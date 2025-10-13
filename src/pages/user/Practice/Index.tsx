import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import { Badge } from '@components/ui/Badge'
import JobInput from '@components/JobInput'
import { useAppContext } from '@context/AppContext'
import { apiService } from '@services/apiService'
import { logger } from '@utils/logger'

const PracticeIndex: React.FC = () => {
  const { handleJobSubmit } = useAppContext()
  const navigate = useNavigate()
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null)

  const handleJobSubmitAndNavigate = async (jobData: any) => {
    // Check if this is a job-based interview (has company field)
    if (jobData.company) {
      try {
        logger.info('Starting job-based interview session:', jobData)
        
        // Start session via API
        const response = await apiService.startSession({
          mode: 'interview',
          jobContext: {
            jobTitle: jobData.role || '',
            jobDescription: jobData.jobDescription || '',
            company: jobData.company
          }
        })

        logger.info('Job-based interview session started successfully:', response)

        // Navigate to the session simulation page
        navigate(`/session/${response.sessionId}`)
        return
      } catch (error) {
        logger.error('Failed to start job-based interview session:', error)
        // Fall through to fallback
      }
    }

    // Fallback to existing practice flow
    await handleJobSubmit(jobData.jobDescription || '', jobData.role || '')
    navigate('/practice/live')
  }

  const handleScenarioStart = async (scenarioId: string) => {
    setLoadingScenario(scenarioId)
    
    try {
      logger.info('Starting practice scenario:', scenarioId)
      
      // Start session via API
      const response = await apiService.startSession({
        mode: 'practice',
        scenarioId: scenarioId
      })

      logger.info('Practice session started successfully:', response)

      // Navigate to the session simulation page
      navigate(`/session/${response.sessionId}`)
    } catch (error) {
      logger.error('Failed to start practice session:', error)
      
      // Fallback to existing job submission flow
      const scenario = practiceScenarios.find(s => s.id === scenarioId)
      if (scenario) {
        await handleJobSubmitAndNavigate({
          jobDescription: `Practice ${scenario.title} interview questions`,
          role: scenario.title,
          company: 'Practice Company',
          level: scenario.difficulty.toLowerCase()
        })
      }
    } finally {
      setLoadingScenario(null)
    }
  }

  const practiceScenarios = [
    {
      id: 'technical',
      title: 'Technical Interview',
      description: 'Coding challenges, system design, and technical problem-solving',
      difficulty: 'Medium',
      duration: '45-60 min'
    },
    {
      id: 'behavioral',
      title: 'Behavioral Interview',
      description: 'STAR method, leadership, teamwork, and situational questions',
      difficulty: 'Easy',
      duration: '30-45 min'
    },
    {
      id: 'product',
      title: 'Product Management',
      description: 'Product strategy, user research, and product design questions',
      difficulty: 'Hard',
      duration: '60-90 min'
    },
    {
      id: 'data',
      title: 'Data Science',
      description: 'Statistics, machine learning, and data analysis scenarios',
      difficulty: 'Hard',
      duration: '45-75 min'
    }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'success'
      case 'Medium': return 'warning'
      case 'Hard': return 'error'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Practice Session
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Select a predefined scenario or generate one using your job description.
        </p>
      </div>

      {/* Section A - Job-Based Practice */}
      <Card className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Personalized Interview Practice (Based on Job Description)
        </h2>
        <JobInput onSubmit={handleJobSubmitAndNavigate} />

      {/* Divider */}
      <div className="relative text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or</span>
        </div>
      </div>

      {/* Section B - Popular Practice Scenarios */}
      <div className='mt-8'>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Popular Practice Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {practiceScenarios.map((scenario) => (
            <Card key={scenario.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {scenario.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {scenario.description}
                  </p>
                </div>
                <Badge variant={getDifficultyColor(scenario.difficulty) as any}>
                  {scenario.difficulty}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {scenario.duration}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handleScenarioStart(scenario.id)}
                  disabled={loadingScenario === scenario.id}
                >
                  {loadingScenario === scenario.id ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Starting...</span>
                    </div>
                  ) : (
                    'Start Practice'
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      </Card>

      {/* Pro Tip */}
      <div className="bg-gray-50 p-4 rounded-lg text-sm">
        <p className="text-gray-700">
          Start with easier scenarios to build confidence, then move on to more challenging ones.
        </p>
      </div>
    </div>
  )
}

export default PracticeIndex
