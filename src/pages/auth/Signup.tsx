import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '@layouts/AuthLayout'
import Button from '@components/shared/ui/Button'
import { useAuth } from '@context/AuthContext'

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isFormValid, setIsFormValid] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  // Form validation
  useEffect(() => {
    const validateForm = () => {
      const errors: Record<string, string> = {}
      
      if (!formData.firstName.trim()) {
        errors['firstName'] = 'First name is required'
      }
      
      if (!formData.lastName.trim()) {
        errors['lastName'] = 'Last name is required'
      }
      
      if (!formData.email.trim()) {
        errors['email'] = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors['email'] = 'Please enter a valid email address'
      }
      
      if (!formData.password) {
        errors['password'] = 'Password is required'
      } else if (formData.password.length < 8) {
        errors['password'] = 'Password must be at least 8 characters'
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors['password'] = 'Password must contain uppercase, lowercase, and number'
      }
      
      if (!formData.confirmPassword) {
        errors['confirmPassword'] = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        errors['confirmPassword'] = 'Passwords do not match'
      }
      
      setFieldErrors(errors)
      setIsFormValid(Object.keys(errors).length === 0 && 
        !!formData.firstName.trim() && 
        !!formData.lastName.trim() && 
        !!formData.email.trim() && 
        !!formData.password && 
        !!formData.confirmPassword)
    }

    validateForm()
  }, [formData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!isFormValid) {
      setError('Please fill in all fields correctly')
      setIsLoading(false)
      return
    }

    try {
      // In a real app, you would call a signup API here
      // For now, we'll simulate a successful signup and auto-login
      await new Promise(resolve => setTimeout(resolve, 1500))
      await login(formData.email, formData.password, 'user')
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const InputField: React.FC<{
    id: string
    name: string
    type: string
    label: string
    placeholder: string
    icon: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    error?: string | undefined
    required?: boolean
  }> = ({ id, name, type, label, placeholder, icon, value, onChange, error, required = true }) => (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400 text-lg">{icon}</span>
        </div>
        <input
          id={id}
          name={name}
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          aria-label={label}
          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
            error 
              ? 'border-red-300 bg-red-50' 
              : 'border-gray-300 hover:border-gray-400 focus:border-indigo-500'
          }`}
          placeholder={placeholder}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠️</span>
          {error}
        </p>
      )}
    </div>
  )

  return (
    <AuthLayout 
      title="Create Your Account" 
      subtitle="Join thousands of professionals improving their interview skills"
      isSignup={true}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField
            id="firstName"
            name="firstName"
            type="text"
            label="What's your first name?"
            placeholder="John"
            icon="👤"
            value={formData.firstName}
            onChange={handleChange}
            error={fieldErrors['firstName']}
          />
          
          <InputField
            id="lastName"
            name="lastName"
            type="text"
            label="And your last?"
            placeholder="Doe"
            icon="👤"
            value={formData.lastName}
            onChange={handleChange}
            error={fieldErrors['lastName']}
          />
        </div>

        <InputField
          id="email"
          name="email"
          type="email"
          label="Let's get your email"
          placeholder="john@example.com"
          icon="📧"
          value={formData.email}
          onChange={handleChange}
          error={fieldErrors['email']}
        />

        <InputField
          id="password"
          name="password"
          type="password"
          label="Create a secure password"
          placeholder="At least 8 characters"
          icon="🔒"
          value={formData.password}
          onChange={handleChange}
          error={fieldErrors['password']}
        />

        <InputField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm your password"
          placeholder="Re-enter your password"
          icon="🔒"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={fieldErrors['confirmPassword']}
        />

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="text-gray-700">
              I agree to the{' '}
              <Link to="/terms" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-indigo-600 hover:text-indigo-500 font-medium">
                Privacy Policy
              </Link>
            </label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="w-full py-3 text-base font-medium rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Creating your account...
            </div>
          ) : (
            'Create Account'
          )}
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Log in
            </Link>
          </span>
        </div>

      </form>
    </AuthLayout>
  )
}

export default Signup
