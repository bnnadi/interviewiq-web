import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from '@context/AppContext'
import { AuthProvider, useAuth } from '@context/AuthContext'
import MainLayout from '@layouts/MainLayout'
import ProtectedRoute from '@components/auth/ProtectedRoute'
import LoadingSpinner from '@components/shared/ui/LoadingSpinner'
import SessionResume from '@components/session/SessionResume'

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

// Enterprise pages
const EnterpriseDashboard = lazy(() => import('@pages/enterprise/Dashboard'))
const EnterpriseSessions = lazy(() => import('@pages/enterprise/Sessions'))
const EnterpriseAnalytics = lazy(() => import('@pages/enterprise/Analytics'))
const EnterpriseSettings = lazy(() => import('@pages/enterprise/Settings'))

// Other pages
const NotFound = lazy(() => import('@pages/NotFound'))
const ComponentsDemo = lazy(() => import('@pages/ComponentsDemo'))

// Legacy pages for backward compatibility
const JobInputPage = lazy(() => import('@pages/JobInputPage'))
const QuestionListPage = lazy(() => import('@pages/QuestionListPage'))
const AnswerRecorderPage = lazy(() => import('@pages/AnswerRecorderPage'))
const FeedbackPage = lazy(() => import('@pages/FeedbackPage'))

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
        
        {/* User Routes - Protected */}
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="user">
            <MainLayout>
              <UserDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/practice" element={
          <ProtectedRoute requiredRole="user">
            <MainLayout>
              <PracticeIndex />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/practice/live" element={
          <ProtectedRoute requiredRole="user">
            <MainLayout>
              <PracticeLive />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/feedback/summary" element={
          <ProtectedRoute requiredRole="user">
            <MainLayout>
              <FeedbackSummary />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/feedback/body" element={
          <ProtectedRoute requiredRole="user">
            <MainLayout>
              <FeedbackBody />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/progress" element={
          <ProtectedRoute requiredRole="user">
            <MainLayout>
              <UserProgress />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute requiredRole="user">
            <MainLayout>
              <UserSettings />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute requiredRole="user">
            <MainLayout>
              <UserProfile />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Enterprise Routes - Protected */}
        <Route path="/enterprise/dashboard" element={
          <ProtectedRoute requiredRole="enterprise">
            <MainLayout>
              <EnterpriseDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/enterprise/sessions" element={
          <ProtectedRoute requiredRole="enterprise">
            <MainLayout>
              <EnterpriseSessions />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/enterprise/analytics" element={
          <ProtectedRoute requiredRole="enterprise">
            <MainLayout>
              <EnterpriseAnalytics />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/enterprise/settings" element={
          <ProtectedRoute requiredRole="enterprise">
            <MainLayout>
              <EnterpriseSettings />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Demo Route - No protection needed */}
        <Route path="/demo" element={<ComponentsDemo />} />
        
        {/* Legacy Routes for backward compatibility */}
        <Route path="/interview/new" element={
          <ProtectedRoute requiredRole="user">
            <MainLayout>
              <JobInputPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/interview/questions" element={
          <ProtectedRoute requiredRole="user">
            <MainLayout>
              <QuestionListPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/interview/record" element={
          <ProtectedRoute requiredRole="user">
            <MainLayout>
              <AnswerRecorderPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/interview/feedback" element={
          <ProtectedRoute requiredRole="user">
            <MainLayout>
              <FeedbackPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
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