import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import Button from '../../components/shared/ui/Button'

interface InterviewSimulationProps {
  jobTitle?: string
  company?: string
  currentQuestion?: string
  timeRemaining?: number
  isRecording?: boolean
  onStartRecording?: () => void
  onStopRecording?: () => void
  onNextQuestion?: () => void
  onEndInterview?: () => void
}

const InterviewSimulation: React.FC<InterviewSimulationProps> = ({
  jobTitle = "Software Engineer",
  company = "Tech Corp",
  currentQuestion = "Tell me about a time when you had to solve a complex technical problem.",
  timeRemaining = 300,
  isRecording = false,
  onStartRecording,
  onStopRecording,
  onNextQuestion,
  onEndInterview
}) => {
  const [isPaused, setIsPaused] = useState(false)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mock Interview</h1>
              <p className="text-gray-600">{jobTitle} at {company}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={isRecording ? 'destructive' : 'secondary'}>
                {isRecording ? 'Recording' : 'Paused'}
              </Badge>
              <div className="text-lg font-mono font-semibold text-gray-700">
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Question & Controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Current Question</h2>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {currentQuestion}
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Question 3 of 8</span>
                  <span>•</span>
                  <span>Behavioral</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Recording Controls</h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      variant={isRecording ? 'destructive' : 'primary'}
                      size="lg"
                      onClick={isRecording ? onStopRecording : onStartRecording}
                      className="w-32"
                    >
                      {isRecording ? 'Stop' : 'Start'} Recording
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setIsPaused(!isPaused)}
                      className="w-32"
                    >
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={onNextQuestion}
                      className="flex-1"
                    >
                      Next Question
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={onEndInterview}
                      className="flex-1"
                    >
                      End Interview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Live Feedback */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Live Feedback</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Speaking Pace</span>
                    <Badge variant="success">Good</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Clarity</span>
                    <Badge variant="warning">Improve</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Confidence</span>
                    <Badge variant="success">Strong</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Keywords Used</span>
                    <Badge variant="default">5/8</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Real-time Tips</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <p className="text-sm text-blue-800">
                      💡 Try to be more specific with your examples
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Speak a bit slower for better clarity
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Panel - Transcript */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Live Transcript</h3>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg min-h-[200px] max-h-[300px] overflow-y-auto">
                <p className="text-gray-700 leading-relaxed">
                  "I remember when I was working on a project where we had to optimize the database queries 
                  for our e-commerce platform. The issue was that our product search was taking over 5 seconds 
                  to load, which was causing customers to leave our site..."
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Speaking</span>
                  <span className="ml-2">Last updated: 2 seconds ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default InterviewSimulation
