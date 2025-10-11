import React from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  isSignup?: boolean
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, isSignup = false }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
      {/* Left Column - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
        <div className="flex flex-col justify-center px-12 py-16 text-white relative z-10">
          {/* Logo */}
          <Link to="/" className="mb-8">
            <h1 className="text-4xl font-bold text-white">InterviewIQ</h1>
          </Link>
          
          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4">
              {isSignup ? "Start Your Journey" : "Welcome Back"}
            </h2>
            <p className="text-xl text-indigo-100 leading-relaxed">
              {isSignup 
                ? "Join thousands of professionals who've improved their interview skills with AI-powered practice sessions."
                : "Continue your interview practice and unlock your potential with personalized feedback."
              }
            </p>
          </div>

          {/* Feature Icons */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🎯</span>
              <span className="text-indigo-100">AI-Powered Practice</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📊</span>
              <span className="text-indigo-100">Real-time Feedback</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🚀</span>
              <span className="text-indigo-100">Career Growth</span>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-block">
              <h1 className="text-3xl font-bold text-gray-900">InterviewIQ</h1>
            </Link>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {title}
              </h2>
              {subtitle && (
                <p className="text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>

            {children}
          </div>

          {/* Mobile Feature Icons */}
          <div className="lg:hidden mt-8 flex justify-center space-x-8 text-gray-400">
            <div className="text-center">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-xs">AI Practice</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-xs">Feedback</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1">🚀</div>
              <div className="text-xs">Growth</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
