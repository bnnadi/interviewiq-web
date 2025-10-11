import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '@layouts/AuthLayout'
import Button from '@components/shared/ui/Button'

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSubmitted(true)
    } catch (error) {
      console.error('Password reset failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <AuthLayout 
        title="Check Your Email" 
        subtitle="We've sent password reset instructions to your email"
      >
        <div className="text-center space-y-6">
          <div className="text-6xl">📧</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Reset Instructions Sent
            </h3>
            <p className="text-sm text-gray-600">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
          </div>
          
          <div className="space-y-4">
            <Button
              onClick={() => {
                setIsSubmitted(false)
                setEmail('')
              }}
              variant="outline"
              className="w-full"
            >
              Try Different Email
            </Button>
            
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>

          <div className="text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-blue-600 hover:text-blue-500"
            >
              try again
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout 
      title="Forgot Password?" 
      subtitle="Enter your email and we'll send you reset instructions"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your email address"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-2"
        >
          {isLoading ? 'Sending...' : 'Send Reset Instructions'}
        </Button>

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Back to Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}

export default ForgotPassword
