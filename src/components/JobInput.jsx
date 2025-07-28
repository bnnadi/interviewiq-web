import React, { useState } from 'react'

function JobInput({ onSubmit }) {
  const [jd, setJd] = useState('')
  const [role, setRole] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!jd.trim() || !role.trim()) {
      alert('Please fill in both the job description and role title.')
      return
    }

    setIsSubmitting(true)
    await onSubmit(jd.trim(), role.trim())
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Enter Job Details
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Role Title *
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
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tip</h3>
          <p className="text-sm text-blue-800">
            Include the full job description with requirements, responsibilities, and preferred qualifications 
            for the most relevant interview questions.
          </p>
        </div>
      </div>
    </div>
  )
}

export default JobInput 