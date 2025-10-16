import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import EnterpriseAuthLayout from '@layouts/EnterpriseAuthLayout'
import Button from '@components/shared/ui/Button'
import { useAuth } from '@context/AuthContext'

const EnterpriseLogin: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    organization: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login(formData.email, formData.password, 'enterprise', formData.organization)
      navigate('/enterprise/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enterprise login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <EnterpriseAuthLayout 
      title="Enterprise Login" 
      subtitle="Access your organization's Confida dashboard"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </div>
        )}

        <div>
          <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
            Organization
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">🏢</span>
            </div>
            <input
              id="organization"
              name="organization"
              type="text"
              required
              value={formData.organization}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your organization name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Work Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">📧</span>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your work email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">🔒</span>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              to="/enterprise/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 text-base font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Signing in...
            </div>
          ) : (
            'Sign In to Enterprise'
          )}
        </Button>

        {/* SSO Button Placeholder */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              className="w-full py-3 rounded-xl border-2 border-gray-300 hover:border-indigo-300 transition-all duration-200"
              disabled
            >
              <div className="flex items-center justify-center">
                <span className="mr-2">🔐</span>
                Single Sign-On (SSO)
              </div>
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              SSO integration coming soon
            </p>
          </div>
        </div>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            Need access?{' '}
            <Link
              to="/enterprise/contact"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Contact your administrator
            </Link>
          </span>
        </div>

      </form>
    </EnterpriseAuthLayout>
  )
}

export default EnterpriseLogin
