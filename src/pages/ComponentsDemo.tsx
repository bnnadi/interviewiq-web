import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import Button from '../components/shared/ui/Button'
import { Modal } from '../components/ui/Modal'

// Import all the feature components
import InterviewSimulation from '../features/simulation/InterviewSimulation'
import { FeedbackChipsDemo } from '../features/feedback/FeedbackChips'
import ConfidenceHeatmap from '../features/analytics/ConfidenceHeatmap'
import ReplayWithAnnotations from '../features/feedback/ReplayWithAnnotations'
import ScoreDials from '../features/analytics/ScoreDials'
import STARHelper from '../features/feedback/STARHelper'
import FollowUpSuggestions from '../features/feedback/FollowUpSuggestions'
import AchievementBadges from '../features/achievements/AchievementBadges'
import FeedbackModal from '../features/feedback/FeedbackModal'
import ProgressGraph from '../features/analytics/ProgressGraph'

const ComponentsDemo: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<string | null>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  const components = [
    {
      id: 'interview-simulation',
      title: 'Interview Simulation',
      description: 'Split-view mock interview layout with live feedback',
      component: <InterviewSimulation />,
      category: 'Simulation'
    },
    {
      id: 'feedback-chips',
      title: 'Feedback Chips',
      description: 'Floating real-time feedback badges',
      component: <FeedbackChipsDemo />,
      category: 'Feedback'
    },
    {
      id: 'confidence-heatmap',
      title: 'Confidence Heatmap',
      description: 'Horizontal timeline showing confidence gradient',
      component: <ConfidenceHeatmap data={[]} />,
      category: 'Analytics'
    },
    {
      id: 'replay-annotations',
      title: 'Replay with Annotations',
      description: 'Playback UI with timestamped feedback items',
      component: <ReplayWithAnnotations annotations={[]} duration={300} />,
      category: 'Feedback'
    },
    {
      id: 'score-dials',
      title: 'Score Dials',
      description: 'Visual dials showing verbal + nonverbal scores',
      component: <ScoreDials scores={[]} />,
      category: 'Analytics'
    },
    {
      id: 'star-helper',
      title: 'STAR Helper',
      description: 'Real-time STAR structure progress tracker',
      component: <STARHelper />,
      category: 'Feedback'
    },
    {
      id: 'follow-up-suggestions',
      title: 'Follow-up Suggestions',
      description: 'Smart tips for weak areas post-simulation',
      component: <FollowUpSuggestions />,
      category: 'Feedback'
    },
    {
      id: 'achievement-badges',
      title: 'Achievement Badges',
      description: 'Earned badges and streak displays',
      component: <AchievementBadges />,
      category: 'Achievements'
    },
    {
      id: 'progress-graph',
      title: 'Progress Graph',
      description: 'Longitudinal user performance chart',
      component: <ProgressGraph />,
      category: 'Analytics'
    }
  ]

  const categories = ['All', 'Simulation', 'Feedback', 'Analytics', 'Achievements']
  const [selectedCategory, setSelectedCategory] = useState('All')

  const filteredComponents = selectedCategory === 'All' 
    ? components 
    : components.filter(comp => comp.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">InterviewIQ Components Demo</h1>
              <p className="text-gray-600">Interactive showcase of all UI components</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowFeedbackModal(true)}
              >
                View Feedback Modal
              </Button>
              <Button
                variant="primary"
                onClick={() => window.location.href = '/'}
              >
                Back to App
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComponents.map((comp) => (
            <Card
              key={comp.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveComponent(comp.id)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{comp.title}</h3>
                  <Badge variant="outline" size="sm">
                    {comp.category}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm">{comp.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Preview</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation()
                      setActiveComponent(comp.id)
                    }}
                  >
                    View Component
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Component Modal */}
        {activeComponent && (
          <Modal
            isOpen={!!activeComponent}
            onClose={() => setActiveComponent(null)}
            title={components.find(c => c.id === activeComponent)?.title || 'Component'}
            className="max-w-6xl"
          >
            <div className="max-h-[80vh] overflow-y-auto">
              {components.find(c => c.id === activeComponent)?.component}
            </div>
          </Modal>
        )}

        {/* Feedback Modal Demo */}
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          onRetakeInterview={() => console.log('Retake interview')}
          onViewDetailedFeedback={() => console.log('View detailed feedback')}
          onDownloadReport={() => console.log('Download report')}
        />

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-blue-600">{components.length}</div>
              <div className="text-gray-600">Components Built</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-green-600">{categories.length - 1}</div>
              <div className="text-gray-600">Categories</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-purple-600">100%</div>
              <div className="text-gray-600">TypeScript</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold text-orange-600">Responsive</div>
              <div className="text-gray-600">Mobile Ready</div>
            </CardContent>
          </Card>
        </div>

        {/* Features Overview */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Feedback</h3>
                <p className="text-gray-600 text-sm">
                  Live feedback chips and confidence tracking during interviews
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600 text-sm">
                  Comprehensive performance tracking and progress visualization
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gamification</h3>
                <p className="text-gray-600 text-sm">
                  Achievement badges and streaks to motivate continuous improvement
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-4xl mb-4">🎬</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Replay & Analysis</h3>
                <p className="text-gray-600 text-sm">
                  Review sessions with timestamped annotations and detailed feedback
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-4xl mb-4">⭐</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">STAR Method Helper</h3>
                <p className="text-gray-600 text-sm">
                  Real-time guidance for structured behavioral responses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile Optimized</h3>
                <p className="text-gray-600 text-sm">
                  Fully responsive design that works on all devices
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComponentsDemo
