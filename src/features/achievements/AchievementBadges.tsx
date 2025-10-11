import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Button from '../../components/shared/ui/Button'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'performance' | 'consistency' | 'improvement' | 'milestone' | 'special'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  earned: boolean
  earnedDate?: string
  progress?: number
  maxProgress?: number
  points: number
}

interface StreakData {
  current: number
  longest: number
  type: 'daily' | 'weekly' | 'monthly'
  lastActivity: string
}

interface AchievementBadgesProps {
  achievements?: Achievement[]
  streaks?: StreakData[]
  showProgress?: boolean
  onAchievementClick?: (achievement: Achievement) => void
  onStreakClick?: (streak: StreakData) => void
}

const AchievementBadges: React.FC<AchievementBadgesProps> = ({
  achievements = [],
  streaks = [],
  showProgress = true,
  onAchievementClick,
  onStreakClick
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showEarnedOnly, setShowEarnedOnly] = useState(false)

  // Sample achievements if none provided
  const sampleAchievements: Achievement[] = achievements.length > 0 ? achievements : [
    {
      id: 'first-interview',
      title: 'First Steps',
      description: 'Complete your first mock interview',
      icon: '🎯',
      category: 'milestone',
      rarity: 'common',
      earned: true,
      earnedDate: '2024-01-15',
      points: 10
    },
    {
      id: 'star-master',
      title: 'STAR Master',
      description: 'Use STAR method in 5 consecutive interviews',
      icon: '⭐',
      category: 'performance',
      rarity: 'rare',
      earned: true,
      earnedDate: '2024-01-20',
      points: 50
    },
    {
      id: 'confidence-boost',
      title: 'Confidence Booster',
      description: 'Achieve 90%+ confidence score in 3 interviews',
      icon: '💪',
      category: 'performance',
      rarity: 'epic',
      earned: true,
      earnedDate: '2024-01-25',
      points: 100
    },
    {
      id: 'perfect-week',
      title: 'Perfect Week',
      description: 'Complete 7 interviews in a single week',
      icon: '🔥',
      category: 'consistency',
      rarity: 'rare',
      earned: false,
      progress: 5,
      maxProgress: 7,
      points: 75
    },
    {
      id: 'improvement-guru',
      title: 'Improvement Guru',
      description: 'Improve your average score by 20+ points',
      icon: '📈',
      category: 'improvement',
      rarity: 'epic',
      earned: false,
      progress: 15,
      maxProgress: 20,
      points: 150
    },
    {
      id: 'speed-demon',
      title: 'Speed Demon',
      description: 'Complete 10 interviews in one day',
      icon: '⚡',
      category: 'special',
      rarity: 'legendary',
      earned: false,
      progress: 0,
      maxProgress: 10,
      points: 500
    },
    {
      id: 'streak-master',
      title: 'Streak Master',
      description: 'Maintain a 30-day practice streak',
      icon: '🔥',
      category: 'consistency',
      rarity: 'legendary',
      earned: false,
      progress: 12,
      maxProgress: 30,
      points: 300
    },
    {
      id: 'feedback-champion',
      title: 'Feedback Champion',
      description: 'Implement 50 feedback suggestions',
      icon: '🎖️',
      category: 'improvement',
      rarity: 'epic',
      earned: false,
      progress: 23,
      maxProgress: 50,
      points: 200
    }
  ]

  // Sample streaks if none provided
  const sampleStreaks: StreakData[] = streaks.length > 0 ? streaks : [
    {
      current: 7,
      longest: 15,
      type: 'daily',
      lastActivity: '2024-01-28'
    },
    {
      current: 2,
      longest: 4,
      type: 'weekly',
      lastActivity: '2024-01-28'
    },
    {
      current: 1,
      longest: 2,
      type: 'monthly',
      lastActivity: '2024-01-28'
    }
  ]

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-300 bg-gray-50'
      case 'rare':
        return 'border-blue-300 bg-blue-50'
      case 'epic':
        return 'border-purple-300 bg-purple-50'
      case 'legendary':
        return 'border-yellow-300 bg-yellow-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  const getRarityBadgeColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'secondary'
      case 'rare':
        return 'default'
      case 'epic':
        return 'warning'
      case 'legendary':
        return 'success'
      default:
        return 'secondary'
    }
  }

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'performance':
        return '🎯'
      case 'consistency':
        return '📅'
      case 'improvement':
        return '📈'
      case 'milestone':
        return '🏆'
      case 'special':
        return '✨'
      default:
        return '🏅'
    }
  }

  const getStreakIcon = (type: StreakData['type']) => {
    switch (type) {
      case 'daily':
        return '📅'
      case 'weekly':
        return '📊'
      case 'monthly':
        return '🗓️'
      default:
        return '🔥'
    }
  }

  const categories = ['all', 'performance', 'consistency', 'improvement', 'milestone', 'special']
  const earnedAchievements = sampleAchievements.filter(a => a.earned)
  const totalPoints = earnedAchievements.reduce((sum, a) => sum + a.points, 0)

  const filteredAchievements = sampleAchievements.filter(achievement => {
    const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory
    const earnedMatch = !showEarnedOnly || achievement.earned
    return categoryMatch && earnedMatch
  })

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold text-gray-900">Achievement Overview</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {earnedAchievements.length}
              </div>
              <div className="text-sm text-gray-600">Achievements Earned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {totalPoints}
              </div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {Math.round((earnedAchievements.length / sampleAchievements.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {sampleStreaks[0]?.current || 0}
              </div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streaks */}
      <Card>
        <CardHeader>
          <h4 className="text-lg font-semibold text-gray-900">Current Streaks</h4>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sampleStreaks.map((streak, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-colors cursor-pointer"
                onClick={() => onStreakClick?.(streak)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getStreakIcon(streak.type)}</span>
                    <span className="font-semibold capitalize">{streak.type} Streak</span>
                  </div>
                  <Badge variant="success" size="sm">
                    {streak.current} days
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Best: {streak.longest} days
                </div>
                <div className="text-xs text-gray-500">
                  Last activity: {new Date(streak.lastActivity).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">Achievements</h4>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEarnedOnly(!showEarnedOnly)}
              >
                {showEarnedOnly ? 'Show All' : 'Earned Only'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  achievement.earned
                    ? 'border-green-300 bg-green-50 hover:border-green-400'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${getRarityColor(achievement.rarity)}`}
                onClick={() => onAchievementClick?.(achievement)}
              >
                <div className="text-center space-y-3">
                  {/* Icon and Title */}
                  <div className="space-y-2">
                    <div className="text-4xl">{achievement.icon}</div>
                    <h5 className="font-semibold text-gray-900">{achievement.title}</h5>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>

                  {/* Badges */}
                  <div className="flex justify-center space-x-2">
                    <Badge
                      variant={getRarityBadgeColor(achievement.rarity)}
                      size="sm"
                    >
                      {achievement.rarity}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {getCategoryIcon(achievement.category)} {achievement.category}
                    </Badge>
                  </div>

                  {/* Progress or Earned Status */}
                  {achievement.earned ? (
                    <div className="space-y-1">
                      <div className="text-sm text-green-600 font-medium">
                        ✅ Earned {achievement.earnedDate && new Date(achievement.earnedDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {achievement.points} points
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {showProgress && achievement.progress !== undefined && achievement.maxProgress && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.maxProgress}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {achievement.points} points
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {earnedAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <h4 className="text-lg font-semibold text-gray-900">Recent Achievements</h4>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {earnedAchievements
                .sort((a, b) => new Date(b.earnedDate || '').getTime() - new Date(a.earnedDate || '').getTime())
                .slice(0, 3)
                .map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{achievement.title}</div>
                      <div className="text-sm text-gray-600">{achievement.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        +{achievement.points} pts
                      </div>
                      <div className="text-xs text-gray-500">
                        {achievement.earnedDate && new Date(achievement.earnedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AchievementBadges
