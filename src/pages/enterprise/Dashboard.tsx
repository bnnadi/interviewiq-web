import React from 'react'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import { Badge } from '@components/ui/Badge'
import { useAuth } from '@context/AuthContext'

const EnterpriseDashboard: React.FC = () => {
  const { user, logout } = useAuth()

  // Mock data for enterprise dashboard
  const enterpriseStats = {
    totalUsers: 156,
    activeSessions: 23,
    totalSessions: 1247,
    averageScore: 7.8,
    improvementRate: 22,
    organization: user?.organization || 'Acme Corp'
  }

  const recentActivity = [
    { id: 1, user: 'John Smith', role: 'Software Engineer', score: 8.5, date: '2024-01-15', status: 'completed' },
    { id: 2, user: 'Sarah Johnson', role: 'Product Manager', score: 7.2, date: '2024-01-15', status: 'completed' },
    { id: 3, user: 'Mike Chen', role: 'Data Scientist', score: 9.1, date: '2024-01-14', status: 'completed' },
    { id: 4, user: 'Emily Davis', role: 'UX Designer', score: 6.8, date: '2024-01-14', status: 'in-progress' }
  ]

  const topPerformers = [
    { name: 'Mike Chen', role: 'Data Scientist', avgScore: 9.1, sessions: 12 },
    { name: 'John Smith', role: 'Software Engineer', avgScore: 8.5, sessions: 8 },
    { name: 'Sarah Johnson', role: 'Product Manager', avgScore: 7.8, sessions: 15 }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            Enterprise Dashboard
          </h1>
          <p className="text-gray-600 text-lg mt-2">
            Welcome back, {user?.name} • {enterpriseStats.organization}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={logout}
            variant="outline"
            className="px-4 py-2"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-blue-600 mb-2">{enterpriseStats.totalUsers}</div>
          <div className="text-sm text-gray-600">Total Users</div>
          <div className="text-xs text-green-600 mt-1">+12 this month</div>
        </Card>
        
        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-green-600 mb-2">{enterpriseStats.activeSessions}</div>
          <div className="text-sm text-gray-600">Active Sessions</div>
          <div className="text-xs text-blue-600 mt-1">Live now</div>
        </Card>
        
        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-purple-600 mb-2">{enterpriseStats.totalSessions}</div>
          <div className="text-sm text-gray-600">Total Sessions</div>
          <div className="text-xs text-green-600 mt-1">+{enterpriseStats.improvementRate}% this month</div>
        </Card>
        
        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-orange-600 mb-2">{enterpriseStats.averageScore}</div>
          <div className="text-sm text-gray-600">Avg Score</div>
          <div className="text-xs text-green-600 mt-1">+0.3 from last month</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{activity.user}</div>
                  <div className="text-sm text-gray-600">{activity.role} • {activity.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={activity.score >= 8 ? 'success' : activity.score >= 6 ? 'warning' : 'error'}
                  >
                    {activity.score}/10
                  </Badge>
                  <Badge variant="secondary">
                    {activity.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              className="text-blue-600 hover:text-blue-700"
            >
              View All Activity →
            </Button>
          </div>
        </Card>

        {/* Top Performers */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Performers</h3>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {performer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{performer.name}</div>
                    <div className="text-sm text-gray-600">{performer.role}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{performer.avgScore}/10</div>
                  <div className="text-xs text-gray-500">{performer.sessions} sessions</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => window.location.href = '/enterprise/sessions'}
            className="h-20 flex flex-col items-center justify-center space-y-2"
          >
            <div className="text-2xl">📊</div>
            <div className="font-semibold">View Sessions</div>
          </Button>
          
          <Button
            onClick={() => window.location.href = '/enterprise/analytics'}
            variant="outline"
            className="h-20 flex flex-col items-center justify-center space-y-2"
          >
            <div className="text-2xl">📈</div>
            <div className="font-semibold">Analytics</div>
          </Button>
          
          <Button
            onClick={() => window.location.href = '/enterprise/settings'}
            variant="outline"
            className="h-20 flex flex-col items-center justify-center space-y-2"
          >
            <div className="text-2xl">⚙️</div>
            <div className="font-semibold">Settings</div>
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default EnterpriseDashboard
