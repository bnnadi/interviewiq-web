// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    parseJD: '/api/v1/parse-jd',
    analyzeAnswer: '/api/v1/analyze-answer',
    services: '/api/v1/services'
  }
} as const

export interface ApiEndpoints {
  parseJD: string
  analyzeAnswer: string
  services: string
}

export interface ApiConfig {
  BASE_URL: string
  ENDPOINTS: ApiEndpoints
}
