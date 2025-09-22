// Transcript processing utilities

/**
 * Processes speech recognition results to extract final and interim transcripts
 * @param {SpeechRecognitionEvent} event - The speech recognition result event
 * @returns {Object} Object containing finalTranscript and interimTranscript
 */
export const processTranscriptResults = (event) => {
  let finalTranscript = ''
  let interimTranscript = ''

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const transcript = event.results[i][0].transcript
    if (event.results[i].isFinal) {
      finalTranscript += transcript
    } else {
      interimTranscript += transcript
    }
  }

  return { finalTranscript, interimTranscript }
}

/**
 * Combines transcript and interim transcript into final text
 * @param {string} transcript - Final transcript text
 * @param {string} interimTranscript - Interim transcript text
 * @returns {string} Combined and trimmed transcript
 */
export const getFinalTranscript = (transcript, interimTranscript) => {
  return (transcript + interimTranscript).trim()
}

/**
 * Checks if any transcript content exists
 * @param {string} transcript - Final transcript text
 * @param {string} interimTranscript - Interim transcript text
 * @returns {boolean} True if any transcript exists
 */
export const hasTranscript = (transcript, interimTranscript) => {
  return !!(transcript || interimTranscript)
}

/**
 * Cleans and normalizes transcript text
 * @param {string} text - Raw transcript text
 * @returns {string} Cleaned transcript text
 */
export const cleanTranscript = (text) => {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/[^\w\s.,!?]/g, '') // Remove special characters except basic punctuation
}

/**
 * Validates if transcript meets minimum requirements
 * @param {string} transcript - Transcript text to validate
 * @param {number} minLength - Minimum required length (default: 10)
 * @returns {Object} Validation result with isValid and errors
 */
export const validateTranscript = (transcript, minLength = 10) => {
  const errors = []
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
