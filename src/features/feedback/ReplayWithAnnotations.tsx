import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Button from '../../components/shared/ui/Button'

interface Annotation {
  id: string
  timestamp: number
  type: 'positive' | 'negative' | 'suggestion' | 'keyword' | 'pause'
  title: string
  description: string
  duration?: number
  severity?: 'low' | 'medium' | 'high'
}

interface ReplayWithAnnotationsProps {
  videoSrc?: string
  audioSrc?: string
  annotations: Annotation[]
  duration: number
  onTimeUpdate?: (currentTime: number) => void
  onAnnotationClick?: (annotation: Annotation) => void
}

const ReplayWithAnnotations: React.FC<ReplayWithAnnotationsProps> = ({
  videoSrc,
  audioSrc,
  annotations = [],
  duration = 300,
  onTimeUpdate,
  onAnnotationClick
}) => {
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Sample annotations for demo
  const sampleAnnotations: Annotation[] = annotations.length > 0 ? annotations : [
    {
      id: '1',
      timestamp: 15,
      type: 'positive',
      title: 'Great STAR structure',
      description: 'You clearly outlined the Situation, Task, Action, and Result.',
      severity: 'high'
    },
    {
      id: '2',
      timestamp: 45,
      type: 'suggestion',
      title: 'Add more specifics',
      description: 'Consider mentioning specific metrics or numbers to strengthen your example.',
      severity: 'medium'
    },
    {
      id: '3',
      timestamp: 78,
      type: 'keyword',
      title: 'Used key term: "collaboration"',
      description: 'Good use of industry-relevant terminology.',
      severity: 'low'
    },
    {
      id: '4',
      timestamp: 120,
      type: 'negative',
      title: 'Speaking too fast',
      description: 'Your pace increased significantly here. Try to maintain a steady rhythm.',
      severity: 'high'
    },
    {
      id: '5',
      timestamp: 180,
      type: 'pause',
      title: 'Long pause',
      description: 'Consider using filler phrases like "Let me think about that" instead of silence.',
      severity: 'medium'
    }
  ]

  useEffect(() => {
    const mediaElement = audioRef.current || videoRef.current
    if (!mediaElement) return

    const handleTimeUpdate = () => {
      const time = mediaElement.currentTime
      setCurrentTime(time)
      onTimeUpdate?.(time)
    }

    mediaElement.addEventListener('timeupdate', handleTimeUpdate)
    return () => mediaElement.removeEventListener('timeupdate', handleTimeUpdate)
  }, [onTimeUpdate])

  const handlePlayPause = () => {
    const mediaElement = audioRef.current || videoRef.current
    if (!mediaElement) return

    if (isPlaying) {
      mediaElement.pause()
    } else {
      mediaElement.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (time: number) => {
    const mediaElement = audioRef.current || videoRef.current
    if (!mediaElement) return

    mediaElement.currentTime = time
    setCurrentTime(time)
  }

  const handleRateChange = (rate: number) => {
    const mediaElement = audioRef.current || videoRef.current
    if (!mediaElement) return

    mediaElement.playbackRate = rate
    setPlaybackRate(rate)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getAnnotationIcon = (type: Annotation['type']) => {
    switch (type) {
      case 'positive':
        return '✅'
      case 'negative':
        return '❌'
      case 'suggestion':
        return '💡'
      case 'keyword':
        return '🔑'
      case 'pause':
        return '⏸️'
      default:
        return '📝'
    }
  }

  const getAnnotationColor = (type: Annotation['type']) => {
    switch (type) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'suggestion':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'keyword':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pause':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityColor = (severity: Annotation['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-l-4 border-red-500'
      case 'medium':
        return 'border-l-4 border-yellow-500'
      case 'low':
        return 'border-l-4 border-green-500'
      default:
        return 'border-l-4 border-gray-500'
    }
  }

  const progressPercentage = (currentTime / duration) * 100

  return (
    <div className="space-y-6">
      {/* Media Player */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Interview Replay</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Video/Audio Element */}
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              {videoSrc ? (
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className="w-full h-64 object-cover"
                  controls={false}
                />
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-800">
                  <div className="text-center text-white">
                    <div className="text-6xl mb-4">🎤</div>
                    <p className="text-lg">Audio Recording</p>
                    <p className="text-sm text-gray-400">Duration: {formatTime(duration)}</p>
                  </div>
                </div>
              )}
              
              {/* Hidden audio element for audio-only playback */}
              {audioSrc && (
                <audio
                  ref={audioRef}
                  src={audioSrc}
                  preload="metadata"
                />
              )}

              {/* Play/Pause Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={handlePlayPause}
                  className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                >
                  {isPlaying ? (
                    <svg className="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Progress Bar with Annotations */}
            <div className="space-y-2">
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                
                {/* Annotation markers on timeline */}
                {sampleAnnotations.map((annotation) => (
                  <button
                    key={annotation.id}
                    className="absolute top-0 transform -translate-y-1 -translate-x-1/2"
                    style={{ left: `${(annotation.timestamp / duration) * 100}%` }}
                    onClick={() => {
                      handleSeek(annotation.timestamp)
                      setSelectedAnnotation(annotation)
                      onAnnotationClick?.(annotation)
                    }}
                    title={annotation.title}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${getAnnotationColor(annotation.type).split(' ')[0]}`}>
                      <div className="w-full h-full rounded-full flex items-center justify-center text-xs">
                        {getAnnotationIcon(annotation.type)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Time Display */}
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Speed:</span>
                  {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleRateChange(rate)}
                      className={`px-2 py-1 text-xs rounded ${
                        playbackRate === rate
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSeek(Math.max(0, currentTime - 10))}
                >
                  -10s
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
                >
                  +10s
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Annotations List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Annotations</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sampleAnnotations
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((annotation) => (
                <div
                  key={annotation.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${getAnnotationColor(annotation.type)} ${getSeverityColor(annotation.severity || 'low')} ${
                    selectedAnnotation?.id === annotation.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedAnnotation(annotation)
                    handleSeek(annotation.timestamp)
                    onAnnotationClick?.(annotation)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">
                          {getAnnotationIcon(annotation.type)}
                        </span>
                        <h4 className="font-medium">{annotation.title}</h4>
                        <Badge variant="outline" size="sm">
                          {formatTime(annotation.timestamp)}
                        </Badge>
                      </div>
                      <p className="text-sm opacity-90">{annotation.description}</p>
                    </div>
                    <div className="ml-4">
                      <Badge
                        variant={annotation.severity === 'high' ? 'destructive' : annotation.severity === 'medium' ? 'warning' : 'success'}
                        size="sm"
                      >
                        {annotation.severity}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReplayWithAnnotations
