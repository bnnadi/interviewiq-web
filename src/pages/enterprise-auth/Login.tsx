import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '@layouts/AuthLayout'
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
      await login(formData.email, formData.password, 'enterprise')
      navigate('/enterprise/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enterprise login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout 
      title="Enterprise Login" 
      subtitle="Access your organization's InterviewIQ dashboard"
    >
      {/* Enterprise Branding */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-center mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">IQ</span>
          </div>
          <span className="ml-2 text-lg font-semibold text-blue-900">
            InterviewIQ Enterprise
          </span>
        </div>
        <p className="text-sm text-blue-800 text-center">
          Powered by InterviewIQ Enterprise
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
            Organization
          </label>
          <input
            id="organization"
            name="organization"
            type="text"
            required
            value={formData.organization}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your organization name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Work Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your work email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your password"
          />
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
          className="w-full py-2"
        >
          {isLoading ? 'Signing in...' : 'Sign In to Enterprise'}
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
              className="w-full py-2"
              disabled
            >
              🔐 Single Sign-On (SSO)
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
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Contact your administrator
            </Link>
          </span>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-gray-600 hover:text-gray-500"
          >
            Regular user login
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}

export default EnterpriseLogin
