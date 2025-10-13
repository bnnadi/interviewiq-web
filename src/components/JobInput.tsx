import React, { useState } from 'react'
import { validateJobInput } from '../utils/validation'

interface JobInputProps {
  onSubmit: (data: { jobDescription: string; role: string; company?: string }) => Promise<void>
}

const JobInput = React.memo<JobInputProps>(function JobInput({ onSubmit }) {
  const [jd, setJd] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [company, setCompany] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [validationError, setValidationError] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const { isValid, errors } = validateJobInput(jd, role)
    if (!isValid) {
      setValidationError(errors.join('. '))
      return
    }

    setValidationError('')
    setIsSubmitting(true)
    await onSubmit({
      jobDescription: jd.trim(),
      role: role.trim(),
      ...(company.trim() && { company: company.trim() })
    })
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Generate Personalized Questions
        </h2>
        <p className="text-gray-600 mb-6">
          Enter your job details to get tailored interview questions.
        </p>
        
        {validationError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{validationError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Senior Software Engineer, Product Manager"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              Company (Optional)
            </label>
            <input
              type="text"
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Google, Microsoft, Startup Inc."
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <p className="mt-1 text-sm text-gray-500">
              Include company name for job-specific interview questions
            </p>
          </div>

          <div>
            <label htmlFor="jd" className="block text-sm font-medium text-gray-700 mb-2">
              Job Description *
            </label>
            <textarea
              id="jd"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Copy and paste the complete job description to get personalized interview questions.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !jd.trim() || !role.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Generating Questions...' : 'Generate Questions'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Tip</h3>
          <p className="text-sm text-blue-800">
            Include the full job description with requirements, responsibilities, and preferred qualifications 
            for the most relevant interview questions.
          </p>
        </div>
      </div>
    </div>
  )
})

export default JobInput 