import React, { useState } from 'react'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import { Badge } from '@components/ui/Badge'

const EnterpriseSessions: React.FC = () => {
  const [filter, setFilter] = useState('all')

  // Mock data for enterprise sessions
  const sessions = [
    {
      id: 1,
      user: 'John Smith',
      email: 'john.smith@acme.com',
      role: 'Software Engineer',
      department: 'Engineering',
      score: 8.5,
      duration: 45,
      date: '2024-01-15',
      status: 'completed',
      questions: 5,
      feedback: 'Excellent technical knowledge and communication skills.'
    },
    {
      id: 2,
      user: 'Sarah Johnson',
      email: 'sarah.johnson@acme.com',
      role: 'Product Manager',
      department: 'Product',
      score: 7.2,
      duration: 38,
      date: '2024-01-15',
      status: 'completed',
      questions: 4,
      feedback: 'Good strategic thinking, needs improvement in technical depth.'
    },
    {
      id: 3,
      user: 'Mike Chen',
      email: 'mike.chen@acme.com',
      role: 'Data Scientist',
      department: 'Data',
      score: 9.1,
      duration: 52,
      date: '2024-01-14',
      status: 'completed',
      questions: 6,
      feedback: 'Outstanding performance across all areas.'
    },
    {
      id: 4,
      user: 'Emily Davis',
      email: 'emily.davis@acme.com',
      role: 'UX Designer',
      department: 'Design',
      score: 6.8,
      duration: 35,
      date: '2024-01-14',
      status: 'in-progress',
      questions: 3,
      feedback: 'Good design thinking, working on technical communication.'
    },
    {
      id: 5,
      user: 'Alex Rodriguez',
      email: 'alex.rodriguez@acme.com',
      role: 'DevOps Engineer',
      department: 'Engineering',
      score: 7.9,
      duration: 41,
      date: '2024-01-13',
      status: 'completed',
      questions: 5,
      feedback: 'Strong technical skills, good problem-solving approach.'
    }
  ]

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true
    if (filter === 'completed') return session.status === 'completed'
    if (filter === 'in-progress') return session.status === 'in-progress'
    if (filter === 'high-score') return session.score >= 8
    if (filter === 'low-score') return session.score < 7
    return true
  })


  const getScoreVariant = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 8) return 'success'
    if (score >= 6) return 'warning'
    return 'error'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
          <p className="text-gray-600">Monitor and analyze interview sessions across your organization</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => window.location.href = '/enterprise/analytics'}
            variant="outline"
            className="px-4 py-2"
          >
            View Analytics
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'primary' : 'outline'}
            className="px-4 py-2"
          >
            All Sessions ({sessions.length})
          </Button>
          <Button
            onClick={() => setFilter('completed')}
            variant={filter === 'completed' ? 'primary' : 'outline'}
            className="px-4 py-2"
          >
            Completed ({sessions.filter(s => s.status === 'completed').length})
          </Button>
          <Button
            onClick={() => setFilter('in-progress')}
            variant={filter === 'in-progress' ? 'primary' : 'outline'}
            className="px-4 py-2"
          >
            In Progress ({sessions.filter(s => s.status === 'in-progress').length})
          </Button>
          <Button
            onClick={() => setFilter('high-score')}
            variant={filter === 'high-score' ? 'primary' : 'outline'}
            className="px-4 py-2"
          >
            High Scores ({sessions.filter(s => s.score >= 8).length})
          </Button>
          <Button
            onClick={() => setFilter('low-score')}
            variant={filter === 'low-score' ? 'primary' : 'outline'}
            className="px-4 py-2"
          >
            Needs Improvement ({sessions.filter(s => s.score < 7).length})
          </Button>
        </div>
      </Card>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.map((session) => (
          <Card key={session.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">
                      {session.user.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{session.user}</h3>
                    <p className="text-sm text-gray-600">{session.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <div className="text-sm text-gray-500">Role</div>
                    <div className="font-medium">{session.role}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Department</div>
                    <div className="font-medium">{session.department}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Duration</div>
                    <div className="font-medium">{session.duration} min</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Questions</div>
                    <div className="font-medium">{session.questions}</div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-sm text-gray-500 mb-1">Feedback</div>
                  <p className="text-sm text-gray-700">{session.feedback}</p>
                </div>
                
                <div className="text-sm text-gray-500">
                  Session on {new Date(session.date).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <Badge variant={getScoreVariant(session.score)}>
                  {session.score}/10
                </Badge>
                <Badge variant="secondary">
                  {session.status}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredSessions.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No sessions found</h3>
          <p className="text-gray-600">Try adjusting your filters to see more results.</p>
        </Card>
      )}
    </div>
  )
}

export default EnterpriseSessions
