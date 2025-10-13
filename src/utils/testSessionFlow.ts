// Test utility for verifying session flow functionality
import { apiService } from '@services/apiService'
import { logger } from '@utils/logger'

export const testSessionFlow = async () => {
  try {
    logger.info('Testing session flow...')

    // Test 1: Practice scenario session
    logger.info('Test 1: Starting practice scenario session')
    const practiceResponse = await apiService.startSession({
      mode: 'practice',
      scenarioId: 'technical'
    })
    logger.info('Practice session response:', practiceResponse)

    // Test 2: Job-based interview session
    logger.info('Test 2: Starting job-based interview session')
    const interviewResponse = await apiService.startSession({
      mode: 'interview',
      jobContext: {
        jobTitle: 'Senior Software Engineer',
        jobDescription: 'We are looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and cloud technologies.',
        company: 'Tech Corp'
      }
    })
    logger.info('Interview session response:', interviewResponse)

    // Test 3: Get session details
    if (practiceResponse.sessionId) {
      logger.info('Test 3: Getting practice session details')
      const sessionDetails = await apiService.getSession(practiceResponse.sessionId)
      logger.info('Session details:', sessionDetails)
    }

    logger.info('All tests completed successfully!')
    return true
  } catch (error) {
    logger.error('Session flow test failed:', error)
    return false
  }
}

// Export for use in development console
if (typeof window !== 'undefined') {
  (window as any).testSessionFlow = testSessionFlow
}
