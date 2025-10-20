import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from '@context/AppContext'
import { AuthProvider, useAuth } from '@context/AuthContext'
import MainLayout from '@layouts/MainLayout'
import ProtectedRoute from '@components/auth/ProtectedRoute'
import LoadingSpinner from '@components/shared/ui/LoadingSpinner'
import SessionResume from '@components/session/SessionResume'
import SkipLinks from '@components/accessibility/SkipLinks'
import Announcements from '@components/accessibility/Announcements'
import '@styles/accessibility.css'

// Auth pages
const Login = lazy(() => import('@pages/auth/Login'))
const Signup = lazy(() => import('@pages/auth/Signup'))
const ForgotPassword = lazy(() => import('@pages/auth/ForgotPassword'))

// Enterprise auth pages
const EnterpriseLogin = lazy(() => import('@pages/enterprise-auth/Login'))
const InviteAccept = lazy(() => import('@pages/enterprise-auth/InviteAccept'))

// User pages
const UserDashboard = lazy(() => import('@pages/user/Dashboard'))
const PracticeIndex = lazy(() => import('@pages/user/Practice/Index'))
const PracticeLive = lazy(() => import('@pages/user/Practice/Live'))
const FeedbackSummary = lazy(() => import('@pages/user/Feedback/Summary'))
const FeedbackBody = lazy(() => import('@pages/user/Feedback/Body'))
const UserProgress = lazy(() => import('@pages/user/Progress'))
const UserSettings = lazy(() => import('@pages/user/Settings'))
const UserProfile = lazy(() => import('@pages/user/Profile'))
const DataManagement = lazy(() => import('@pages/user/DataManagement'))

// Enterprise pages
const EnterpriseDashboard = lazy(() => import('@pages/enterprise/Dashboard'))
const EnterpriseSessions = lazy(() => import('@pages/enterprise/Sessions'))
const EnterpriseAnalytics = lazy(() => import('@pages/enterprise/Analytics'))
const EnterpriseSettings = lazy(() => import('@pages/enterprise/Settings'))

// Other pages
const NotFound = lazy(() => import('@pages/NotFound'))

// Legacy pages for backward compatibility
const JobInputPage = lazy(() => import('@pages/JobInputPage'))
const QuestionListPage = lazy(() => import('@pages/QuestionListPage'))
const AnswerRecorderPage = lazy(() => import('@pages/AnswerRecorderPage'))
const FeedbackPage = lazy(() => import('@pages/FeedbackPage'))

// Route configuration for protected routes
interface RouteConfig {
  path: string
  component: React.LazyExoticComponent<React.ComponentType<any>>
  role: 'user' | 'enterprise'
}

const protectedRoutes: RouteConfig[] = [
  // User routes
  { path: '/dashboard', component: UserDashboard, role: 'user' },
  { path: '/practice', component: PracticeIndex, role: 'user' },
  { path: '/practice/live', component: PracticeLive, role: 'user' },
  { path: '/feedback/summary', component: FeedbackSummary, role: 'user' },
  { path: '/feedback/body', component: FeedbackBody, role: 'user' },
  { path: '/progress', component: UserProgress, role: 'user' },
  { path: '/settings', component: UserSettings, role: 'user' },
  { path: '/profile', component: UserProfile, role: 'user' },
  { path: '/data', component: DataManagement, role: 'user' },
  
  // Enterprise routes
  { path: '/enterprise/dashboard', component: EnterpriseDashboard, role: 'enterprise' },
  { path: '/enterprise/sessions', component: EnterpriseSessions, role: 'enterprise' },
  { path: '/enterprise/analytics', component: EnterpriseAnalytics, role: 'enterprise' },
  { path: '/enterprise/settings', component: EnterpriseSettings, role: 'enterprise' },
  
  // Session routes - commented out until SessionSimulation component is created
  // { path: '/session/:sessionId', component: SessionSimulation, role: 'user' },
  
  // Legacy routes for backward compatibility
  { path: '/interview/new', component: JobInputPage, role: 'user' },
  { path: '/interview/questions', component: QuestionListPage, role: 'user' },
  { path: '/interview/record', component: AnswerRecorderPage, role: 'user' },
  { path: '/interview/feedback', component: FeedbackPage, role: 'user' },
]

// Global loading component that waits for auth to finish
const GlobalLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner message="Loading InterviewIQ..." />
        <p className="mt-4 text-gray-600">Initializing your experience...</p>
      </div>
    </div>
  )
}

// Smart root redirect component
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  // Redirect based on user role
  const dashboardPath = user?.role === 'enterprise' 
    ? '/enterprise/dashboard' 
    : '/dashboard'
  
  return <Navigate to={dashboardPath} replace />
}

const AppContent: React.FC = () => {
  const { isLoading } = useAuth()

  // Show global loading screen until auth is determined
  if (isLoading) {
    return <GlobalLoadingScreen />
  }

  return (
    <>
      <SkipLinks />
      <Announcements />
      <SessionResume />
      <Suspense fallback={<GlobalLoadingScreen />}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Enterprise Auth Routes */}
          <Route path="/enterprise/login" element={<EnterpriseLogin />} />
          <Route path="/enterprise/invite" element={<InviteAccept />} />
          
          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

        {/* Protected Routes - Dynamically Generated */}
        {protectedRoutes.map(({ path, component: Component, role }) => (
          <Route 
            key={path}
            path={path} 
            element={
              <ProtectedRoute requiredRole={role}>
                <MainLayout>
                  <Component />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
        ))}
        
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}

function App(): JSX.Element {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  )
}

export default App 