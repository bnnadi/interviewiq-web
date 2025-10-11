import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ErrorMessage from '@components/shared/ui/ErrorMessage'
import LoadingSpinner from '@components/shared/ui/LoadingSpinner'
import { useAppContext } from '@context/AppContext'
import { useAuth } from '@context/AuthContext'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { error, loading, setError } = useAppContext()
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isEnterprise = user?.role === 'enterprise'
  const isUser = user?.role === 'user'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link 
                to={isEnterprise ? "/enterprise/dashboard" : "/dashboard"} 
                className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
              >
                InterviewIQ
                {isEnterprise && <span className="text-sm text-blue-600 ml-2">Enterprise</span>}
              </Link>
            </div>
            
            {/* User Navigation */}
            {isUser && (
              <nav className="hidden md:flex space-x-8">
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/dashboard'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/practice"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/practice')
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Practice
                </Link>
                <Link
                  to="/feedback/summary"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/feedback')
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Feedback
                </Link>
                <Link
                  to="/progress"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/progress'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Progress
                </Link>
              </nav>
            )}

            {/* Enterprise Navigation */}
            {isEnterprise && (
              <nav className="hidden md:flex space-x-8">
                <Link
                  to="/enterprise/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/enterprise/dashboard'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/enterprise/sessions"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/enterprise/sessions'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Sessions
                </Link>
                <Link
                  to="/enterprise/analytics"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/enterprise/analytics'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Analytics
                </Link>
              </nav>
            )}

            <div className="flex items-center space-x-4">
              {(isUser || isEnterprise) && (
                <>
                  <Link
                    to={isEnterprise ? "/enterprise/settings" : "/settings"}
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Settings
                  </Link>
                  {isUser && (
                    <Link
                      to="/profile"
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      Profile
                    </Link>
                  )}
                </>
              )}
              
              <Link
                to="/demo"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Demo
              </Link>
              
              {(isUser || isEnterprise) && (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage 
            error={error} 
            onDismiss={() => setError(null)}
            showNetworkStatus={true}
          />
          
          {loading && <LoadingSpinner message="Processing..." />}
          
          {!loading && children}
        </div>
      </main>
    </div>
  )
}

export default MainLayout
