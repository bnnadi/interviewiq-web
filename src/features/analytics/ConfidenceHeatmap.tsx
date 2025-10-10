import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'

interface ConfidenceDataPoint {
  timestamp: number
  confidence: number // 0-100
  label?: string
  event?: 'question_start' | 'question_end' | 'feedback' | 'pause' | 'resume'
}

interface ConfidenceHeatmapProps {
  data: ConfidenceDataPoint[]
  currentTime?: number
  totalDuration?: number
  showLabels?: boolean
  showEvents?: boolean
  height?: number
  onTimeClick?: (timestamp: number) => void
}

const ConfidenceHeatmap: React.FC<ConfidenceHeatmapProps> = ({
  data = [],
  currentTime = 0,
  totalDuration = 300, // 5 minutes default
  showLabels = true,
  showEvents = true,
  height = 120,
  onTimeClick
}) => {
  const [hoveredTime, setHoveredTime] = useState<number | null>(null)

  // Generate sample data if none provided
  const sampleData: ConfidenceDataPoint[] = data.length > 0 ? data : [
    { timestamp: 0, confidence: 60, label: 'Start', event: 'question_start' },
    { timestamp: 30, confidence: 75, label: 'Building up' },
    { timestamp: 60, confidence: 85, label: 'Peak confidence' },
    { timestamp: 90, confidence: 70, label: 'Slight dip' },
    { timestamp: 120, confidence: 80, label: 'Recovery' },
    { timestamp: 150, confidence: 90, label: 'Strong finish' },
    { timestamp: 180, confidence: 65, label: 'New question', event: 'question_start' },
    { timestamp: 210, confidence: 55, label: 'Struggling' },
    { timestamp: 240, confidence: 70, label: 'Improving' },
    { timestamp: 270, confidence: 85, label: 'Good recovery' },
    { timestamp: 300, confidence: 80, label: 'End', event: 'question_end' }
  ]

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500'
    if (confidence >= 60) return 'bg-yellow-500'
    if (confidence >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getConfidenceIntensity = (confidence: number) => {
    // Map confidence to opacity (0.3 to 1.0)
    return Math.max(0.3, confidence / 100)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const time = percentage * totalDuration
    setHoveredTime(time)
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const time = percentage * totalDuration
    onTimeClick?.(time)
  }

  const getCurrentConfidence = () => {
    const sortedData = [...sampleData].sort((a, b) => a.timestamp - b.timestamp)
    for (let i = sortedData.length - 1; i >= 0; i--) {
      const dataPoint = sortedData[i]
      if (dataPoint && dataPoint.timestamp <= currentTime) {
        return dataPoint.confidence
      }
    }
    return 0
  }

  const getEventMarkers = () => {
    return sampleData.filter(point => point.event).map(point => ({
      ...point,
      position: (point.timestamp / totalDuration) * 100
    }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Confidence Timeline</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>High (80-100%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Medium (60-79%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Low (0-59%)</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600">Current Confidence</div>
              <div className="text-2xl font-bold text-gray-900">
                {getCurrentConfidence()}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Time</div>
              <div className="text-lg font-mono font-semibold">
                {formatTime(currentTime)}
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="relative">
            <div
              className="relative cursor-pointer"
              style={{ height: `${height}px` }}
              onMouseMove={handleMouseMove}
              onClick={handleClick}
              onMouseLeave={() => setHoveredTime(null)}
            >
              {/* Background grid */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 border-r border-gray-200"
                    style={{ borderRightWidth: i === 5 ? 0 : 1 }}
                  />
                ))}
              </div>

              {/* Confidence bars */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: 60 }, (_, i) => {
                  const time = (i / 60) * totalDuration
                  const nextTime = ((i + 1) / 60) * totalDuration
                  
                  // Find confidence for this time segment
                  const relevantData = sampleData
                    .filter(point => point.timestamp >= time && point.timestamp < nextTime)
                    .sort((a, b) => a.timestamp - b.timestamp)
                  
                  const confidence = relevantData.length > 0 
                    ? relevantData[0]?.confidence || 0
                    : getCurrentConfidence()

                  return (
                    <div
                      key={i}
                      className="flex-1 relative group"
                      style={{
                        backgroundColor: getConfidenceColor(confidence).replace('bg-', ''),
                        opacity: getConfidenceIntensity(confidence)
                      }}
                    >
                      {/* Hover tooltip */}
                      {hoveredTime && hoveredTime >= time && hoveredTime < nextTime && (
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                          {formatTime(time)} - {confidence}%
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Current time indicator */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-600 z-20"
                style={{ left: `${(currentTime / totalDuration) * 100}%` }}
              >
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-600 rounded-full"></div>
              </div>

              {/* Event markers */}
              {showEvents && getEventMarkers().map((event, index) => (
                <div
                  key={index}
                  className="absolute top-0 w-1 h-full bg-gray-800 z-10"
                  style={{ left: `${event.position}%` }}
                  title={`${event.event} at ${formatTime(event.timestamp)}`}
                >
                  <div className="absolute -top-2 -left-1 w-3 h-3 bg-gray-800 rounded-full"></div>
                </div>
              ))}
            </div>

            {/* Time labels */}
            {showLabels && (
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0:00</span>
                <span>1:00</span>
                <span>2:00</span>
                <span>3:00</span>
                <span>4:00</span>
                <span>5:00</span>
              </div>
            )}
          </div>

          {/* Hover info */}
          {hoveredTime !== null && (
            <div className="text-sm text-gray-600 text-center">
              Hovering at {formatTime(hoveredTime)} - Click to jump to this time
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ConfidenceHeatmap
