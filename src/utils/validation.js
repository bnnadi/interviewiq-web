// Input validation utilities
import { validateTranscript as validateTranscriptText } from './transcriptUtils.js'

export const validateJobInput = (jd, role) => {
  const errors = []
  
  if (!jd.trim()) errors.push('Job description is required')
  if (!role.trim()) errors.push('Role title is required')
  if (jd.trim().length < 50) errors.push('Job description should be at least 50 characters')
  
  return { isValid: errors.length === 0, errors }
}

// Re-export transcript validation from transcriptUtils for consistency
export const validateTranscript = validateTranscriptText
