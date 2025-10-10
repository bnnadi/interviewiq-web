import React, { useState } from 'react'
import { Card } from '@components/ui/Card'
import Button from '@components/shared/ui/Button'
import { ProgressBar } from '@components/ui/ProgressBar'

const EnterpriseAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d')

  // Mock analytics data
  const analyticsData = {
    totalSessions: 1247,
    averageScore: 7.8,
    improvementRate: 22,
    completionRate: 89,
    topSkills: [
      { skill: 'Communication', score: 85, trend: 'up' },
      { skill: 'Technical Knowledge', score: 78, trend: 'up' },
      { skill: 'Problem Solving', score: 82, trend: 'stable' },
      { skill: 'Confidence', score: 75, trend: 'up' },
      { skill: 'Body Language', score: 88, trend: 'up' }
    ],
    departmentStats: [
      { department: 'Engineering', sessions: 456, avgScore: 8.2, improvement: 18 },
      { department: 'Product', sessions: 234, avgScore: 7.5, improvement: 25 },
      { department: 'Data', sessions: 189, avgScore: 8.7, improvement: 15 },
      { department: 'Design', sessions: 156, avgScore: 7.1, improvement: 30 },
      { department: 'Marketing', sessions: 212, avgScore: 6.8, improvement: 35 }
    ],
    monthlyTrend: [
      { month: 'Jan', sessions: 234, avgScore: 7.2 },
      { month: 'Feb', sessions: 267, avgScore: 7.5 },
      { month: 'Mar', sessions: 289, avgScore: 7.8 },
      { month: 'Apr', sessions: 312, avgScore: 8.1 },
      { month: 'May', sessions: 298, avgScore: 7.9 },
      { month: 'Jun', sessions: 325, avgScore: 8.3 }
    ]
  }

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your organization's interview performance</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button
            onClick={() => window.location.href = '/enterprise/sessions'}
            variant="outline"
            className="px-4 py-2"
          >
            View Sessions
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{analyticsData.totalSessions}</div>
          <div className="text-sm text-gray-600">Total Sessions</div>
          <div className="text-xs text-green-600 mt-1">+15% this month</div>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{analyticsData.averageScore}</div>
          <div className="text-sm text-gray-600">Average Score</div>
          <div className="text-xs text-green-600 mt-1">+{analyticsData.improvementRate}% improvement</div>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{analyticsData.completionRate}%</div>
          <div className="text-sm text-gray-600">Completion Rate</div>
          <div className="text-xs text-blue-600 mt-1">Above industry avg</div>
        </Card>
        
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">4.2</div>
          <div className="text-sm text-gray-600">Avg Questions</div>
          <div className="text-xs text-gray-500 mt-1">Per session</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skill Breakdown */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Skill Performance</h3>
          <div className="space-y-4">
            {analyticsData.topSkills.map((skill, index) => (
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

        {/* Department Performance */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Department Performance</h3>
          <div className="space-y-4">
            {analyticsData.departmentStats.map((dept, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{dept.department}</div>
                  <div className="text-sm text-gray-600">{dept.sessions} sessions</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{dept.avgScore}/10</div>
                  <div className="text-xs text-green-600">+{dept.improvement}% improvement</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Monthly Performance Trend</h3>
        <div className="space-y-4">
          {analyticsData.monthlyTrend.map((month, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{month.month}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{month.sessions} sessions</span>
                    <span className="text-sm font-semibold text-gray-900">{month.avgScore}/10</span>
                  </div>
                </div>
                <ProgressBar value={month.avgScore * 10} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Insights */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Key Insights</h3>
        <div className="space-y-3 text-blue-800">
          <div className="flex items-start">
            <span className="mr-2">•</span>
            <span>Engineering department shows the highest performance with an average score of 8.2/10</span>
          </div>
          <div className="flex items-start">
            <span className="mr-2">•</span>
            <span>Communication skills have improved by 15% over the last quarter</span>
          </div>
          <div className="flex items-start">
            <span className="mr-2">•</span>
            <span>Marketing team shows the highest improvement rate at 35%</span>
          </div>
          <div className="flex items-start">
            <span className="mr-2">•</span>
            <span>Overall completion rate of 89% exceeds industry standards</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default EnterpriseAnalytics
