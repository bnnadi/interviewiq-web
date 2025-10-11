import React from 'react'
import { Card } from './ui/Card'
import Button from './shared/ui/Button'

interface DashboardViewProps {
  // Props will be defined based on usage
  [key: string]: any
}

const DashboardView: React.FC<DashboardViewProps> = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Track your interview practice progress and performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
            <div className="text-gray-600">Sessions Completed</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">0</div>
            <div className="text-gray-600">Average Score</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
            <div className="text-gray-600">Questions Practiced</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Sessions
          </h2>
          <div className="text-center text-gray-500 py-8">
            No sessions yet. Start practicing to see your progress here.
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Button 
              className="w-full justify-center"
              onClick={() => {
                // This will be handled by the parent component
                console.log('Start new interview')
              }}
            >
              Start New Interview
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-center"
              onClick={() => {
                console.log('View progress')
              }}
            >
              View Progress
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default DashboardView
