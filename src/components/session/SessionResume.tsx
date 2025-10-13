import React, { useState, useEffect } from 'react'
import { useSessionPersistence } from '../../hooks/useSessionPersistence'
import { useAuth } from '../../context/AuthContext'
import Button from '../shared/ui/Button'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { formatDistanceToNow } from 'date-fns'

interface SessionResumeProps {
  onSessionResumed?: (sessionId: string) => void
  onDismiss?: () => void
  autoShow?: boolean
}

const SessionResume: React.FC<SessionResumeProps> = ({
  onSessionResumed,
  onDismiss,
  autoShow = true
}) => {
  const { isAuthenticated } = useAuth()
  const { incompleteSessions, resumeSession, refreshSessionHistory } = useSessionPersistence()
  const [isVisible, setIsVisible] = useState(false)
  const [isResuming, setIsResuming] = useState(false)
  const [dismissedSessions, setDismissedSessions] = useState<Set<string>>(new Set())

  // Load dismissed sessions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('dismissedSessions')
    if (stored) {
      try {
        const dismissedArray = JSON.parse(stored)
        setDismissedSessions(new Set(dismissedArray))
      } catch (error) {
        console.warn('Failed to parse dismissed sessions:', error)
      }
    }
  }, [])

  // Check for incomplete sessions on mount (only if authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      refreshSessionHistory()
    }
  }, [refreshSessionHistory, isAuthenticated])

  // Clean up dismissed sessions that are no longer incomplete
  useEffect(() => {
    if (incompleteSessions.length > 0) {
      const incompleteSessionIds = new Set(incompleteSessions.map(s => s.id))
      const newDismissedSessions = new Set([...dismissedSessions].filter(id => incompleteSessionIds.has(id)))
      
      if (newDismissedSessions.size !== dismissedSessions.size) {
        setDismissedSessions(newDismissedSessions)
        localStorage.setItem('dismissedSessions', JSON.stringify([...newDismissedSessions]))
      }
    } else if (dismissedSessions.size > 0) {
      // If no incomplete sessions, clear all dismissed sessions
      setDismissedSessions(new Set())
      localStorage.removeItem('dismissedSessions')
    }
  }, [incompleteSessions, dismissedSessions])

  // Show resume dialog if there are incomplete sessions and autoShow is enabled (only if authenticated)
  useEffect(() => {
    if (isAuthenticated && autoShow && incompleteSessions.length > 0) {
      const latestSession = incompleteSessions[0]
      // Only show if the latest session hasn't been dismissed
      if (latestSession && !dismissedSessions.has(latestSession.id)) {
        setIsVisible(true)
      }
    }
  }, [incompleteSessions, autoShow, isAuthenticated, dismissedSessions])

  const handleResumeSession = async (sessionId: string) => {
    setIsResuming(true)
    try {
      const success = await resumeSession(sessionId)
      if (success) {
        setIsVisible(false)
        onSessionResumed?.(sessionId)
      }
    } catch (error) {
      console.error('Failed to resume session:', error)
    } finally {
      setIsResuming(false)
    }
  }

  const handleDismiss = () => {
    const latestSession = incompleteSessions[0]
    if (latestSession) {
      // Add session to dismissed set
      const newDismissedSessions = new Set(dismissedSessions)
      newDismissedSessions.add(latestSession.id)
      setDismissedSessions(newDismissedSessions)
      
      // Save to localStorage
      localStorage.setItem('dismissedSessions', JSON.stringify([...newDismissedSessions]))
    }
    
    setIsVisible(false)
    onDismiss?.()
  }

  const handleStartNew = () => {
    const latestSession = incompleteSessions[0]
    if (latestSession) {
      // Add session to dismissed set
      const newDismissedSessions = new Set(dismissedSessions)
      newDismissedSessions.add(latestSession.id)
      setDismissedSessions(newDismissedSessions)
      
      // Save to localStorage
      localStorage.setItem('dismissedSessions', JSON.stringify([...newDismissedSessions]))
    }
    
    setIsVisible(false)
    onDismiss?.()
  }

  // Don't show modal if user is not authenticated
  if (!isAuthenticated || !isVisible || incompleteSessions.length === 0) {
    return null
  }

  const latestSession = incompleteSessions[0] // Most recent incomplete session
  
  if (!latestSession) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Resume Session?
            </h2>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              You have an incomplete interview session. Would you like to resume where you left off?
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{latestSession.role}</span>
                <Badge variant={latestSession.status === 'in_progress' ? 'default' : 'secondary'}>
                  {latestSession.status}
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Progress:</span>
                  <span>{latestSession.questionsAnswered} / {latestSession.totalQuestions} questions</span>
                </div>
                <div className="flex justify-between">
                  <span>Started:</span>
                  <span>{formatDistanceToNow(latestSession.startTime, { addSuffix: true })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last saved:</span>
                  <span>{formatDistanceToNow(latestSession.lastSaved, { addSuffix: true })}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${latestSession.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => handleResumeSession(latestSession.id)}
              disabled={isResuming}
              className="flex-1"
            >
              {isResuming ? 'Resuming...' : 'Resume Session'}
            </Button>
            
            <Button
              onClick={handleStartNew}
              variant="outline"
              className="flex-1"
            >
              Start New
            </Button>
          </div>

          {incompleteSessions.length > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                You have {incompleteSessions.length - 1} other incomplete session{incompleteSessions.length > 2 ? 's' : ''}.
              </p>
              <button
                onClick={() => {/* TODO: Show session history modal */}}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all sessions →
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default SessionResume
