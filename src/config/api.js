// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    parseJD: '/api/v1/parse-jd',
    analyzeAnswer: '/api/v1/analyze-answer',
    services: '/api/v1/services'
  }
}
