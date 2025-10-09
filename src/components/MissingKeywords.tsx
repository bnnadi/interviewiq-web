import React from 'react'

interface MissingKeywordsProps {
  keywords: string[]
}

const MissingKeywords = React.memo<MissingKeywordsProps>(function MissingKeywords({ keywords }) {
  if (!keywords || keywords.length === 0) return null

  return (
    <div className="mb-8 p-6 bg-red-50 rounded-lg">
      <h3 className="text-lg font-semibold text-red-900 mb-3">
        Missing Keywords from Job Description
      </h3>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full"
          >
            {keyword}
          </span>
        ))}
      </div>
      <p className="text-red-700 text-sm mt-3">
        Consider incorporating these keywords naturally into your future answers to better align with the job requirements.
      </p>
    </div>
  )
})

export default MissingKeywords
