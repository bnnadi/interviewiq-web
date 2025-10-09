// Transcript processing utilities

interface TranscriptResult {
  finalTranscript: string
  interimTranscript: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  cleanedTranscript: string
}

/**
 * Processes speech recognition results to extract final and interim transcripts
 */
export const processTranscriptResults = (event: SpeechRecognitionEvent): TranscriptResult => {
  let finalTranscript = ''
  let interimTranscript = ''

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i]
    const alternative = result?.[0]
    if (alternative) {
      const transcript = alternative.transcript
      if (result.isFinal) {
        finalTranscript += transcript
      } else {
        interimTranscript += transcript
      }
    }
  }

  return { finalTranscript, interimTranscript }
}

/**
 * Combines transcript and interim transcript into final text
 */
export const getFinalTranscript = (transcript: string, interimTranscript: string): string => {
  return (transcript + interimTranscript).trim()
}

/**
 * Checks if any transcript content exists
 */
export const hasTranscript = (transcript: string, interimTranscript: string): boolean => {
  return !!(transcript || interimTranscript)
}

/**
 * Cleans and normalizes transcript text
 */
export const cleanTranscript = (text: string): string => {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/[^\w\s.,!?]/g, '') // Remove special characters except basic punctuation
}

/**
 * Validates if transcript meets minimum requirements
 */
export const validateTranscript = (transcript: string, minLength: number = 10): ValidationResult => {
  const errors: string[] = []
  const cleaned = cleanTranscript(transcript)
  
  if (!cleaned) {
    errors.push('Please provide an answer before submitting')
  } else if (cleaned.length < minLength) {
    errors.push(`Answer should be at least ${minLength} characters`)
  }
  
  return { 
    isValid: errors.length === 0, 
    errors,
    cleanedTranscript: cleaned
  }
}
