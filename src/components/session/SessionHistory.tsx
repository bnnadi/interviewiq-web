import React, { useState, useEffect } from 'react'
import { SessionSummary } from '../../types/session'
import { useSessionPersistence } from '../../hooks/useSessionPersistence'
import Button from '../shared/ui/Button'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { formatDistanceToNow, format } from 'date-fns'

interface SessionHistoryProps {
  onSessionSelected?: (sessionId: string) => void
  showIncompleteOnly?: boolean
  maxSessions?: number
}

const SessionHistory: React.FC<SessionHistoryProps> = ({
  onSessionSelected,
  showIncompleteOnly = false,
  maxSessions = 10
}) => {
  const { 
    sessionHistory, 
    incompleteSessions, 
    resumeSession, 
    deleteSession, 
    refreshSessionHistory,
    clearExpiredSessions 
  } = useSessionPersistence()
  
  const [isLoading, setIsLoading] = useState(false)
  const [deletingSession, setDeletingSession] = useState<string | null>(null)

  const sessionsToShow = showIncompleteOnly ? incompleteSessions : sessionHistory
  const displayedSessions = sessionsToShow.slice(0, maxSessions)

  useEffect(() => {
    refreshSessionHistory()
  }, [refreshSessionHistory])

  const handleResumeSession = async (sessionId: string) => {
    setIsLoading(true)
    try {
      const success = await resumeSession(sessionId)
      if (success) {
        onSessionSelected?.(sessionId)
      }
    } catch (error) {
      console.error('Failed to resume session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    setDeletingSession(sessionId)
    try {
      await deleteSession(sessionId)
      await refreshSessionHistory()
    } catch (error) {
      console.error('Failed to delete session:', error)
    } finally {
      setDeletingSession(null)
    }
  }

  const handleClearExpired = async () => {
    setIsLoading(true)
    try {
      await clearExpiredSessions()
      await refreshSessionHistory()
    } catch (error) {
      console.error('Failed to clear expired sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: SessionSummary['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'abandoned':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: SessionSummary['status']) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )
      case 'in_progress':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )
      case 'abandoned':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
    }
  }

  if (displayedSessions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium mb-2">No sessions found</p>
          <p className="text-sm">
            {showIncompleteOnly 
              ? "You don't have any incomplete sessions."
              : "Complete an interview session to see your history here."
            }
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {showIncompleteOnly ? 'Incomplete Sessions' : 'Session History'}
        </h3>
        <div className="flex space-x-2">
          <Button
            onClick={handleClearExpired}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            Clear Expired
          </Button>
          <Button
            onClick={refreshSessionHistory}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Sessions list */}
      <div className="space-y-3">
        {displayedSessions.map((session) => (
          <Card key={session.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {session.role}
                  </h4>
                  <Badge className={getStatusColor(session.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(session.status)}
                      <span className="capitalize">{session.status}</span>
                    </div>
                  </Badge>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Progress:</span>
                    <span>{session.questionsAnswered} / {session.totalQuestions} questions</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Started:</span>
                    <span>{format(session.startTime, 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last activity:</span>
                    <span>{formatDistanceToNow(session.lastSaved, { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${session.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {session.status === 'in_progress' && (
                  <Button
                    onClick={() => handleResumeSession(session.id)}
                    size="sm"
                    disabled={isLoading}
                  >
                    Resume
                  </Button>
                )}
                
                <Button
                  onClick={() => handleDeleteSession(session.id)}
                  variant="outline"
                  size="sm"
                  disabled={deletingSession === session.id}
                >
                  {deletingSession === session.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Show more indicator */}
      {sessionsToShow.length > maxSessions && (
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Showing {maxSessions} of {sessionsToShow.length} sessions
          </p>
        </div>
      )}
    </div>
  )
}

export default SessionHistory
