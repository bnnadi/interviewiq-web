import React from 'react'
import { Link } from 'react-router-dom'

interface EnterpriseAuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

const EnterpriseAuthLayout: React.FC<EnterpriseAuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>
      
      <div className="relative max-w-md mx-auto w-full">
        {/* Enterprise Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-indigo-600">IQ</span>
              </div>
              <div className="ml-3 text-left">
                <h1 className="text-2xl font-bold text-white">InterviewIQ</h1>
                <p className="text-sm text-blue-200">Enterprise</p>
              </div>
            </div>
          </Link>
          
          <h2 className="text-3xl font-bold text-white mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-blue-200 text-lg">
              {subtitle}
            </p>
          )}
        </div>

        {/* Enterprise Features */}
        <div className="mb-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-2xl mb-2">🏢</div>
            <div className="text-xs text-blue-200">Organization</div>
            <div className="text-xs text-white font-medium">Management</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-xs text-blue-200">Analytics</div>
            <div className="text-xs text-white font-medium">& Insights</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="text-2xl mb-2">🔐</div>
            <div className="text-xs text-blue-200">Enterprise</div>
            <div className="text-xs text-white font-medium">Security</div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 animate-fade-in">
          {children}
        </div>

        {/* Enterprise Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-blue-200 text-sm">
            <span>🔒 Enterprise Security</span>
            <span>•</span>
            <span>📈 Advanced Analytics</span>
            <span>•</span>
            <span>👥 Team Management</span>
          </div>
          
          <div className="mt-4 text-xs text-blue-300">
            <p>Powered by InterviewIQ Enterprise Platform</p>
            <p className="mt-1">Trusted by Fortune 500 companies worldwide</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnterpriseAuthLayout
