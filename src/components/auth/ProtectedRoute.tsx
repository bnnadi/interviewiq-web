import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, UserRole } from '@context/AuthContext'
import LoadingSpinner from '@components/shared/ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole
}) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner message="Checking authentication..." />
      </div>
    )
  }

  // Redirect to appropriate login if not authenticated
  if (!isAuthenticated) {
    const loginPath = location.pathname.startsWith('/enterprise') 
      ? '/enterprise/login' 
      : '/login'
    return <Navigate to={loginPath} state={{ from: location }} replace />
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user's actual role
    const dashboardPath = user?.role === 'enterprise' 
      ? '/enterprise/dashboard' 
      : '/dashboard'
    return <Navigate to={dashboardPath} replace />
  }

  // Prevent role switching - redirect users away from wrong role areas
  if (user?.role === 'enterprise' && !location.pathname.startsWith('/enterprise')) {
    return <Navigate to="/enterprise/dashboard" replace />
  }

  if (user?.role === 'user' && location.pathname.startsWith('/enterprise')) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
