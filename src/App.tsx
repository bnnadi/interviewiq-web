import React from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppProvider, useAppContext } from './context/AppContext'
import ErrorMessage from './components/shared/ui/ErrorMessage'
import LoadingSpinner from './components/shared/ui/LoadingSpinner'
import DashboardPage from './pages/DashboardPage'
import JobInputPage from './pages/JobInputPage'
import QuestionListPage from './pages/QuestionListPage'
import AnswerRecorderPage from './pages/AnswerRecorderPage'
import FeedbackPage from './pages/FeedbackPage'
import ComponentsDemo from './pages/ComponentsDemo'

const AppContent: React.FC = () => {
  const { error, loading, setError } = useAppContext()
  const location = useLocation()

  // Show demo if on demo route
  if (location.pathname === '/demo') {
    return <ComponentsDemo />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <Link to="/dashboard" className="text-4xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                InterviewIQ
              </Link>
              <p className="text-gray-600">
                AI-powered interview coaching with intelligent feedback
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              <Link
                to="/demo"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Components Demo
              </Link>
            </div>
          </div>
        </header>

        <ErrorMessage error={error} onDismiss={() => setError(null)} />

        {loading && <LoadingSpinner message="Processing..." />}

        {!loading && (
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/interview/new" element={<JobInputPage />} />
            <Route path="/interview/questions" element={<QuestionListPage />} />
            <Route path="/interview/record" element={<AnswerRecorderPage />} />
            <Route path="/interview/feedback" element={<FeedbackPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        )}
      </div>
    </div>
  )
}

function App(): JSX.Element {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App 