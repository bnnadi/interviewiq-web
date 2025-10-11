import { API_CONFIG } from '../config/api'

interface ParseJobDescriptionRequest {
  role: string
  jobDescription: string
}

interface AnalyzeAnswerRequest {
  jobDescription: string
  question: string
  answer: string
}

export class ApiService {
  private baseURL: string

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  private async makeRequest<T>(endpoint: string, data: unknown, operation: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error && error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network error: Unable to connect to server. Please check your internet connection.`)
      }
      throw new Error(`Failed to ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async parseJobDescription(role: string, jobDescription: string): Promise<{ questions: string[] }> {
    return this.makeRequest<{ questions: string[] }>(
      API_CONFIG.ENDPOINTS.parseJD, 
      { role, jobDescription } as ParseJobDescriptionRequest, 
      'parse job description'
    )
  }

  async analyzeAnswer(jobDescription: string, question: string, answer: string): Promise<unknown> {
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.analyzeAnswer, 
      { jobDescription, question, answer } as AnalyzeAnswerRequest, 
      'analyze answer'
    )
  }
}

// Create a singleton instance
export const apiService = new ApiService()
