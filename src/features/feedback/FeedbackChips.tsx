import React, { useState, useEffect } from 'react'
import { Badge } from '../../components/ui/Badge'

interface FeedbackChip {
  id: string
  type: 'positive' | 'warning' | 'negative' | 'info'
  message: string
  timestamp: number
  duration?: number
  icon?: string
}

interface FeedbackChipsProps {
  feedback: FeedbackChip[]
  maxVisible?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  autoHide?: boolean
  onChipClick?: (chip: FeedbackChip) => void
}

const FeedbackChips: React.FC<FeedbackChipsProps> = ({
  feedback = [],
  maxVisible = 5,
  position = 'top-right',
  autoHide = true,
  onChipClick
}) => {
  const [visibleChips, setVisibleChips] = useState<FeedbackChip[]>([])

  useEffect(() => {
    // Sort by timestamp and take the most recent ones
    const sortedFeedback = [...feedback]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxVisible)

    setVisibleChips(sortedFeedback)

    // Auto-hide chips after their duration
    if (autoHide) {
      sortedFeedback.forEach(chip => {
        if (chip.duration) {
          setTimeout(() => {
            setVisibleChips(prev => prev.filter(c => c.id !== chip.id))
          }, chip.duration)
        }
      })
    }
  }, [feedback, maxVisible, autoHide])

  const getVariant = (type: FeedbackChip['type']) => {
    switch (type) {
      case 'positive':
        return 'success'
      case 'warning':
        return 'warning'
      case 'negative':
        return 'destructive'
      case 'info':
      default:
        return 'default'
    }
  }

  const getIcon = (type: FeedbackChip['type'], icon?: string) => {
    if (icon) return icon
    
    switch (type) {
      case 'positive':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'negative':
        return '❌'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }

  return (
    <div className={`fixed z-50 ${positionClasses[position]} space-y-2 max-w-sm`}>
      {visibleChips.map((chip, index) => (
        <div
          key={chip.id}
          className={`transform transition-all duration-300 ease-in-out ${
            index === 0 ? 'scale-100 opacity-100' : 'scale-95 opacity-90'
          } hover:scale-105`}
          style={{
            animationDelay: `${index * 100}ms`,
            animation: 'slideInFromRight 0.3s ease-out'
          }}
        >
          <Badge
            variant={getVariant(chip.type)}
            size="lg"
            className={`
              cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200
              ${chip.type === 'positive' ? 'hover:bg-green-200' : ''}
              ${chip.type === 'warning' ? 'hover:bg-yellow-200' : ''}
              ${chip.type === 'negative' ? 'hover:bg-red-200' : ''}
              ${chip.type === 'info' ? 'hover:bg-blue-200' : ''}
            `}
            onClick={() => onChipClick?.(chip)}
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm">
                {getIcon(chip.type, chip.icon)}
              </span>
              <span className="font-medium">{chip.message}</span>
            </div>
          </Badge>
        </div>
      ))}
      
      <style>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

// Example usage component for demonstration
export const FeedbackChipsDemo: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackChip[]>([])
  // const [counter, setCounter] = useState(0)

  const addFeedback = (type: FeedbackChip['type'], message: string) => {
    const newChip: FeedbackChip = {
      id: `chip-${Date.now()}`,
      type,
      message,
      timestamp: Date.now(),
      duration: 5000 // 5 seconds
    }
    setFeedback(prev => [...prev, newChip])
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6">Feedback Chips Demo</h2>
        
        <div className="space-y-4">
          <button
            onClick={() => addFeedback('positive', 'Great answer!')}
            className="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Positive Feedback
          </button>
          
          <button
            onClick={() => addFeedback('warning', 'Speak slower')}
            className="w-full p-3 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Add Warning Feedback
          </button>
          
          <button
            onClick={() => addFeedback('negative', 'Use more examples')}
            className="w-full p-3 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Add Negative Feedback
          </button>
          
          <button
            onClick={() => addFeedback('info', 'Good use of STAR method')}
            className="w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Info Feedback
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Active Feedback ({feedback.length})</h3>
          <div className="text-sm text-gray-600">
            {feedback.length === 0 ? 'No active feedback chips' : 'Check the top-right corner for floating chips'}
          </div>
        </div>
      </div>

      <FeedbackChips
        feedback={feedback}
        maxVisible={3}
        position="top-right"
        autoHide={true}
        onChipClick={(chip) => console.log('Chip clicked:', chip)}
      />
    </div>
  )
}

export default FeedbackChips
