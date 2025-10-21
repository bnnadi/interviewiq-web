import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import { Badge } from '@components/ui/Badge'
import { useAppContext } from '@context/AppContext'
import { sessionStorage } from '@services/sessionPersistence'
import { SessionSummary } from '../../types/session'

const Dashboard: React.FC = () => {
  const { handleViewSessions, currentSession, isSessionActive } = useAppContext()
  const [sessionHistory, setSessionHistory] = useState<SessionSummary[]>([])
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageScore: 0,
    improvementRate: 0,
    currentStreak: 0
  })
  
  // Load session history on component mount
  useEffect(() => {
    const loadSessionHistory = async () => {
      try {
        const sessions = await sessionStorage.getAllSessions()
        setSessionHistory(sessions)
        
        // Calculate stats from session history
        const completedSessions = getCompletedSessions(sessions)
        const totalSessions = completedSessions.length
        
        // For now, use mock data for scores since we don't have score data in SessionSummary
        // In a real implementation, you'd store scores in the session data
        const averageScore = totalSessions > 0 ? 7.2 : 0 // Mock average score
        const improvementRate = totalSessions > 1 ? 15 : 0 // Mock improvement rate
        const currentStreak = calculateCurrentStreak(completedSessions)
        
        setStats({
          totalSessions,
          averageScore,
          improvementRate,
          currentStreak
        })
      } catch (error) {
        console.error('Failed to load session history:', error)
        // Fallback to mock data if loading fails
        setStats({
          totalSessions: 12,
          averageScore: 7.2,
          improvementRate: 15,
          currentStreak: 5
        })
      }
    }
    
    loadSessionHistory()
  }, [])
  
  // Extract date normalization logic
  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date)
    normalized.setHours(0, 0, 0, 0)
    return normalized
  }

  // Extract session sorting logic
  const sortSessionsByDate = (sessions: SessionSummary[]): SessionSummary[] => {
    return sessions.sort((a, b) => 
      new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime()
    )
  }

  // Extract streak calculation logic
  const calculateStreakFromSessions = (sessions: SessionSummary[]): number => {
    if (sessions.length === 0) return 0
    
    const sortedSessions = sortSessionsByDate(sessions)
    const today = normalizeDate(new Date())
    let streak = 0
    
    for (const session of sortedSessions) {
      const sessionDate = normalizeDate(new Date(session.lastSaved))
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === streak) {
        streak++
      } else if (daysDiff > streak) {
        break
      }
    }
    
    return streak
  }

  // Calculate current streak from session history
  const calculateCurrentStreak = (sessions: SessionSummary[]): number => {
    return calculateStreakFromSessions(sessions)
  }
  
  // Extract session processing logic
  const processSessionForDisplay = (session: SessionSummary) => ({
    id: session.id,
    role: session.role,
    date: new Date(session.lastSaved).toLocaleDateString(),
    score: 7.2, // Mock score - in real implementation, store this in session data
    status: session.status
  })

  const getCompletedSessions = (sessions: SessionSummary[]): SessionSummary[] => {
    return sessions.filter(s => s.status === 'completed')
  }

  // Get recent sessions (last 3)
  const recentSessions = getCompletedSessions(sessionHistory)
    .slice(0, 3)
    .map(processSessionForDisplay)

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
          <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalSessions}</div>
          <div className="text-sm text-gray-600">Total Sessions</div>
        </Card>
        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-green-600 mb-2">{stats.averageScore.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Average Score</div>
        </Card>
        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-purple-600 mb-2">+{stats.improvementRate}%</div>
          <div className="text-sm text-gray-600">Improvement</div>
        </Card>
        <Card className="p-6 text-center hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-orange-600 mb-2">{stats.currentStreak}</div>
          <div className="text-sm text-gray-600">Day Streak</div>
        </Card>
      </div>

      {/* Current Session Alert */}
      {isSessionActive && currentSession && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-1">
                🎯 Active Session
              </h3>
              <p className="text-blue-800">
                You have an ongoing interview session for <strong>{currentSession.role}</strong>
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Started {new Date(currentSession.startTime).toLocaleString()}
              </p>
            </div>
            <Link to="/practice/live">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Continue Session
              </Button>
            </Link>
          </div>
        </Card>
      )}

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
