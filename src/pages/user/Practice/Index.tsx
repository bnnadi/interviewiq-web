import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import { Badge } from '@components/ui/Badge'
import JobInput from '@components/JobInput'
import { useAppContext } from '@context/AppContext'

const PracticeIndex: React.FC = () => {
  const { handleJobSubmit } = useAppContext()
  const navigate = useNavigate()

  const handleJobSubmitAndNavigate = async (jobData: any) => {
    await handleJobSubmit(jobData.jobDescription || '', jobData.role || '')
    navigate('/practice/live')
  }

  const practiceScenarios = [
    {
      id: 'technical',
      title: 'Technical Interview',
      description: 'Coding challenges, system design, and technical problem-solving',
      difficulty: 'Medium',
      duration: '45-60 min',
      icon: '💻'
    },
    {
      id: 'behavioral',
      title: 'Behavioral Interview',
      description: 'STAR method, leadership, teamwork, and situational questions',
      difficulty: 'Easy',
      duration: '30-45 min',
      icon: '🤝'
    },
    {
      id: 'product',
      title: 'Product Management',
      description: 'Product strategy, user research, and product design questions',
      difficulty: 'Hard',
      duration: '60-90 min',
      icon: '📊'
    },
    {
      id: 'data',
      title: 'Data Science',
      description: 'Statistics, machine learning, and data analysis scenarios',
      difficulty: 'Hard',
      duration: '45-75 min',
      icon: '📈'
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
          Choose Your Practice Scenario
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Select a practice scenario that matches your interview type, or create a custom one based on your specific role.
        </p>
      </div>

      {/* Custom Job Input */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom Practice Session</h2>
        <p className="text-gray-600 mb-6">
          Enter details about the role you're interviewing for to get personalized questions.
        </p>
        <JobInput onSubmit={handleJobSubmitAndNavigate} />
      </Card>

      {/* Practice Scenarios */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Popular Practice Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {practiceScenarios.map((scenario) => (
            <Card key={scenario.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl mb-2">{scenario.icon}</div>
                <Badge variant={getDifficultyColor(scenario.difficulty) as any}>
                  {scenario.difficulty}
                </Badge>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {scenario.title}
              </h3>
              
              <p className="text-gray-600 mb-4">
                {scenario.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  ⏱️ {scenario.duration}
                </span>
                <Button
                  variant="outline"
                  className="group-hover:bg-blue-50 group-hover:border-blue-300 transition-colors"
                  onClick={async () => {
                    // For now, we'll use a mock job submission for predefined scenarios
                    await handleJobSubmitAndNavigate({
                      jobDescription: `Practice ${scenario.title} interview questions`,
                      role: scenario.title,
                      company: 'Practice Company',
                      level: scenario.difficulty.toLowerCase()
                    })
                  }}
                >
                  Start Practice
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-2">🎯 Pro Tip</h3>
        <p className="text-green-800">
          Start with easier scenarios to build confidence, then gradually move to more challenging ones. 
          Each practice session helps you identify areas for improvement.
        </p>
      </Card>
    </div>
  )
}

export default PracticeIndex
