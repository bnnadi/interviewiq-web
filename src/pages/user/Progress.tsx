import React from 'react'
import { Card } from '@components/ui/Card'
import { ProgressBar } from '@components/ui/ProgressBar'
import Button from '@components/shared/ui/Button'
import { useAppContext } from '@context/AppContext'

const Progress: React.FC = () => {
  const { handleViewAnalytics } = useAppContext()

  // Mock data for progress analytics
  const progressData = {
    totalSessions: 12,
    averageScore: 7.2,
    improvementRate: 15,
    currentStreak: 5,
    bestScore: 9.1,
    worstScore: 5.8
  }

  const weeklyProgress = [
    { week: 'Week 1', score: 6.2, sessions: 3 },
    { week: 'Week 2', score: 6.8, sessions: 4 },
    { week: 'Week 3', score: 7.1, sessions: 3 },
    { week: 'Week 4', score: 7.2, sessions: 2 }
  ]

  const skillBreakdown = [
    { skill: 'Communication', score: 85, trend: 'up' },
    { skill: 'Technical Knowledge', score: 78, trend: 'up' },
    { skill: 'Problem Solving', score: 82, trend: 'stable' },
    { skill: 'Confidence', score: 75, trend: 'up' },
    { skill: 'Body Language', score: 88, trend: 'up' }
  ]

  const achievements = [
    { id: 1, title: 'First Interview', description: 'Completed your first practice session', earned: true, date: '2024-01-01' },
    { id: 2, title: 'Streak Master', description: '5-day practice streak', earned: true, date: '2024-01-15' },
    { id: 3, title: 'High Scorer', description: 'Scored 8.5+ in a session', earned: true, date: '2024-01-10' },
    { id: 4, title: 'Consistent Performer', description: '10+ completed sessions', earned: true, date: '2024-01-20' },
    { id: 5, title: 'Improvement Champion', description: '15%+ improvement over time', earned: false, date: null }
  ]

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      case 'stable': return '➡️'
      default: return '➡️'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Your Progress
        </h1>
        <p className="text-gray-600 text-lg">
          Track your improvement and celebrate your achievements
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{progressData.totalSessions}</div>
          <div className="text-sm text-gray-600 mb-2">Total Sessions</div>
          <div className="text-xs text-green-600">+3 this week</div>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{progressData.averageScore}</div>
          <div className="text-sm text-gray-600 mb-2">Average Score</div>
          <div className="text-xs text-green-600">+{progressData.improvementRate}% improvement</div>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{progressData.currentStreak}</div>
          <div className="text-sm text-gray-600 mb-2">Day Streak</div>
          <div className="text-xs text-blue-600">Keep it up!</div>
        </Card>
      </div>

      {/* Score Range */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Score Range</h3>
        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{progressData.bestScore}</div>
            <div className="text-sm text-gray-600">Best Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{progressData.worstScore}</div>
            <div className="text-sm text-gray-600">Worst Score</div>
          </div>
        </div>
        <ProgressBar value={((progressData.averageScore - progressData.worstScore) / (progressData.bestScore - progressData.worstScore)) * 100} />
      </Card>

      {/* Weekly Progress */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Weekly Progress</h3>
        <div className="space-y-4">
          {weeklyProgress.map((week, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{week.week}</span>
                  <span className={`text-sm font-semibold ${getScoreColor(week.score)}`}>
                    {week.score}/10
                  </span>
                </div>
                <ProgressBar value={week.score * 10} className="mb-1" />
                <div className="text-xs text-gray-500">{week.sessions} sessions</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Skill Breakdown */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Skill Breakdown</h3>
        <div className="space-y-4">
          {skillBreakdown.map((skill, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{skill.skill}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-semibold ${getScoreColor(skill.score)}`}>
                      {skill.score}%
                    </span>
                    <span className="text-lg">{getTrendIcon(skill.trend)}</span>
                  </div>
                </div>
                <ProgressBar value={skill.score} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Achievements */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border-2 ${
                achievement.earned
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                <span className="text-2xl">{achievement.earned ? '🏆' : '🔒'}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
              {achievement.earned && achievement.date && (
                <div className="text-xs text-green-600">Earned on {achievement.date}</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          onClick={handleViewAnalytics}
          variant="outline"
          className="px-6 py-2"
        >
          View Detailed Analytics
        </Button>
        <Button
          onClick={() => window.location.href = '/practice'}
          className="px-6 py-2"
        >
          Continue Practicing
        </Button>
      </div>
    </div>
  )
}

export default Progress
