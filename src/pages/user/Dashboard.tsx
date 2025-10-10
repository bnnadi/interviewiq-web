import React from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import { Badge } from '@components/ui/Badge'
import { useAppContext } from '@context/AppContext'

const Dashboard: React.FC = () => {
  const { handleViewSessions } = useAppContext()
  
  // Mock data for now - will be replaced with real data later
  const mockStats = {
    totalSessions: 12,
    averageScore: 7.2,
    improvementRate: 15,
    currentStreak: 5
  }

  const recentSessions = [
    { id: 1, role: 'Software Engineer', date: '2024-01-15', score: 8.5, status: 'completed' },
    { id: 2, role: 'Product Manager', date: '2024-01-14', score: 7.2, status: 'completed' },
    { id: 3, role: 'Data Scientist', date: '2024-01-13', score: 6.8, status: 'completed' }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome back!
        </h1>
        <p className="text-gray-600 text-lg">
          Ready to ace your next interview? Let's continue your journey.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-blue-600 mb-2">{mockStats.totalSessions}</div>
          <div className="text-sm text-gray-600">Total Sessions</div>
        </Card>
        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-green-600 mb-2">{mockStats.averageScore}</div>
          <div className="text-sm text-gray-600">Average Score</div>
        </Card>
        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-purple-600 mb-2">+{mockStats.improvementRate}%</div>
          <div className="text-sm text-gray-600">Improvement</div>
        </Card>
        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-orange-600 mb-2">{mockStats.currentStreak}</div>
          <div className="text-sm text-gray-600">Day Streak</div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/practice">
          <Button className="px-8 py-3 text-lg font-semibold w-full sm:w-auto">
            Start New Interview
          </Button>
        </Link>
        <Button
          onClick={handleViewSessions}
          variant="outline"
          className="px-8 py-3 text-lg w-full sm:w-auto"
        >
          View Sessions
        </Button>
        <Link to="/progress">
          <Button
            variant="outline"
            className="px-8 py-3 text-lg w-full sm:w-auto"
          >
            View Analytics
          </Button>
        </Link>
      </div>

      {/* Recent Sessions */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Sessions</h3>
        <div className="space-y-3">
          {recentSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">{session.role}</div>
                <div className="text-sm text-gray-600">{session.date}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={session.score >= 8 ? 'success' : session.score >= 6 ? 'warning' : 'error'}
                >
                  {session.score}/10
                </Badge>
                <Badge variant="secondary">
                  {session.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Button
            onClick={handleViewSessions}
            variant="outline"
            className="text-blue-600 hover:text-blue-700"
          >
            View All Sessions →
          </Button>
        </div>
      </Card>

      {/* Quick Tips */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Quick Tip</h3>
        <p className="text-blue-800">
          Practice the STAR method (Situation, Task, Action, Result) to structure your answers effectively. 
          This technique helps you provide clear, comprehensive responses that interviewers love.
        </p>
      </Card>
    </div>
  )
}

export default Dashboard
