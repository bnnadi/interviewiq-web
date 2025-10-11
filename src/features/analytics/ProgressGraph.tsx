import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'

interface DataPoint {
  date: string
  overallScore: number
  communicationScore: number
  technicalScore: number
  confidenceScore: number
  behavioralScore: number
  sessionId: string
  jobTitle?: string
  company?: string
}

interface ProgressGraphProps {
  data?: DataPoint[]
  timeRange?: 'week' | 'month' | 'quarter' | 'year' | 'all'
  showTrend?: boolean
  showCategories?: boolean
  height?: number
  onDataPointClick?: (dataPoint: DataPoint) => void
}

const ProgressGraph: React.FC<ProgressGraphProps> = ({
  data = [],
  timeRange = 'month',
  showTrend = true,
  showCategories = true,
  height = 400,
  onDataPointClick
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'overall' | 'communication' | 'technical' | 'confidence' | 'behavioral'>('overall')
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Generate sample data if none provided
  const generateSampleData = (): DataPoint[] => {
    const sampleData: DataPoint[] = []
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30) // 30 days ago

    for (let i = 0; i < 15; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i * 2)
      
      // Simulate realistic progress with some variation
      const baseScore = 60 + (i * 2) + Math.random() * 10
      const variation = (Math.random() - 0.5) * 15
      
      sampleData.push({
        date: date.toISOString().split('T')[0] || '',
        overallScore: Math.max(0, Math.min(100, baseScore + variation)),
        communicationScore: Math.max(0, Math.min(100, baseScore + variation + (Math.random() - 0.5) * 10)),
        technicalScore: Math.max(0, Math.min(100, baseScore + variation + (Math.random() - 0.5) * 8)),
        confidenceScore: Math.max(0, Math.min(100, baseScore + variation + (Math.random() - 0.5) * 12)),
        behavioralScore: Math.max(0, Math.min(100, baseScore + variation + (Math.random() - 0.5) * 6)),
        sessionId: `session-${i + 1}`,
        jobTitle: ['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer'][i % 4] || '',
        company: ['Tech Corp', 'StartupXYZ', 'BigTech Inc', 'Innovation Co'][i % 4] || ''
      })
    }
    return sampleData
  }

  const sampleData = data.length > 0 ? data : generateSampleData()

  const getTimeRangeData = (data: DataPoint[], range: string) => {
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (range) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        return data
    }
    
    return data.filter(point => new Date(point.date) >= cutoffDate)
  }

  const filteredData = getTimeRangeData(sampleData, timeRange)
  const sortedData = [...filteredData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'overall':
        return '#3B82F6'
      case 'communication':
        return '#10B981'
      case 'technical':
        return '#8B5CF6'
      case 'confidence':
        return '#F59E0B'
      case 'behavioral':
        return '#EF4444'
      default:
        return '#6B7280'
    }
  }

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'overall':
        return 'Overall Score'
      case 'communication':
        return 'Communication'
      case 'technical':
        return 'Technical'
      case 'confidence':
        return 'Confidence'
      case 'behavioral':
        return 'Behavioral'
      default:
        return 'Score'
    }
  }

  const calculateTrend = (data: DataPoint[], metric: string) => {
    if (data.length < 2) return 0
    
    const firstScore = data[0]?.[`${metric}Score` as keyof DataPoint] as number || 0
    const lastScore = data[data.length - 1]?.[`${metric}Score` as keyof DataPoint] as number || 0
    
    return lastScore - firstScore
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return '📈'
    if (trend < -5) return '📉'
    return '➡️'
  }

  const getTrendColor = (trend: number) => {
    if (trend > 5) return 'text-green-600'
    if (trend < -5) return 'text-red-600'
    return 'text-gray-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getAverageScore = (data: DataPoint[], metric: string) => {
    const scores = data.map(point => point[`${metric}Score` as keyof DataPoint] as number)
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  const trend = calculateTrend(sortedData, selectedMetric)
  const averageScore = getAverageScore(sortedData, selectedMetric)

  // Simple SVG line chart (in a real app, you'd use a charting library like Chart.js or D3)
  const renderChart = () => {
    if (sortedData.length === 0) return null

    const width = 800
    const chartHeight = height
    const padding = 60
    const chartWidth = width - padding * 2
    const chartHeightInner = chartHeight - padding * 2

    const minScore = Math.min(...sortedData.map(d => d[`${selectedMetric}Score` as keyof DataPoint] as number))
    const maxScore = Math.max(...sortedData.map(d => d[`${selectedMetric}Score` as keyof DataPoint] as number))
    const scoreRange = maxScore - minScore || 1

    const points = sortedData.map((point, index) => {
      const x = padding + (index / (sortedData.length - 1)) * chartWidth
      const y = padding + chartHeightInner - ((point[`${selectedMetric}Score` as keyof DataPoint] as number - minScore) / scoreRange) * chartHeightInner
      return { x, y, data: point }
    })

    const pathData = points.map((point, index) => 
      `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    ).join(' ')

    return (
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="w-full h-full"
        viewBox={`0 0 ${width} ${chartHeight}`}
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(score => {
          const y = padding + chartHeightInner - ((score - minScore) / scoreRange) * chartHeightInner
          return (
            <g key={score}>
              <line
                x1={padding}
                y1={y}
                x2={padding + chartWidth}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth={1}
              />
              <text
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-500"
              >
                {score}
              </text>
            </g>
          )
        })}

        {/* Line path */}
        <path
          d={pathData}
          fill="none"
          stroke={getMetricColor(selectedMetric)}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={getMetricColor(selectedMetric)}
            className="cursor-pointer hover:r-6 transition-all"
            onMouseEnter={() => setHoveredPoint(point.data)}
            onMouseLeave={() => setHoveredPoint(null)}
            onClick={() => onDataPointClick?.(point.data)}
          />
        ))}

        {/* X-axis labels */}
        {sortedData.map((point, index) => {
          const x = padding + (index / (sortedData.length - 1)) * chartWidth
          return (
              <text
                key={index}
                x={x}
                y={chartHeight - 10}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
              {formatDate(point.date)}
            </text>
          )
        })}
      </svg>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Performance Progress</h3>
            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <div className="flex space-x-1">
                {['week', 'month', 'quarter', 'year', 'all'].map((range) => (
                  <button
                    key={range}
                    onClick={() => {/* setTimeRange(range as any) */}}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Metric Selector */}
            <div className="flex flex-wrap gap-2">
              {['overall', 'communication', 'technical', 'confidence', 'behavioral'].map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric as any)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedMetric === metric
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getMetricLabel(metric)}
                </button>
              ))}
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {averageScore.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
              {showTrend && (
                <>
                  <div className={`text-2xl font-bold ${getTrendColor(trend)}`}>
                    {getTrendIcon(trend)} {Math.abs(trend).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Trend</div>
                </>
              )}
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {sortedData.length}
                </div>
                <div className="text-sm text-gray-600">Sessions</div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div style={{ height: `${height}px` }}>
                {renderChart()}
              </div>
            </div>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div className="fixed z-50 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none">
                <div className="font-medium">{formatDate(hoveredPoint.date)}</div>
                <div>{getMetricLabel(selectedMetric)}: {hoveredPoint[`${selectedMetric}Score` as keyof DataPoint]}%</div>
                {hoveredPoint.jobTitle && (
                  <div className="text-xs text-gray-300">{hoveredPoint.jobTitle} at {hoveredPoint.company}</div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Comparison */}
      {showCategories && (
        <Card>
          <CardHeader>
            <h4 className="text-lg font-semibold text-gray-900">Category Comparison</h4>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['communication', 'technical', 'confidence', 'behavioral'].map((metric) => {
                const avgScore = getAverageScore(sortedData, metric)
                const trend = calculateTrend(sortedData, metric)
                
                return (
                  <div key={metric} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getMetricColor(metric) }}
                      />
                      <span className="font-medium text-gray-900">
                        {getMetricLabel(metric)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-semibold text-gray-900">
                        {avgScore.toFixed(1)}%
                      </span>
                      <div className={`flex items-center space-x-1 ${getTrendColor(trend)}`}>
                        <span>{getTrendIcon(trend)}</span>
                        <span className="text-sm">
                          {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ProgressGraph
