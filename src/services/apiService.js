import { API_CONFIG } from '../config/api.js'

export class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  async #makeRequest(endpoint, data, operation) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      throw new Error(`Failed to ${operation}: ${error.message}`)
    }
  }

  async parseJobDescription(role, jobDescription) {
    return this.#makeRequest(
      API_CONFIG.ENDPOINTS.parseJD, 
      { role, jobDescription }, 
      'parse job description'
    )
  }

  async analyzeAnswer(jobDescription, question, answer) {
    return this.#makeRequest(
      API_CONFIG.ENDPOINTS.analyzeAnswer, 
      { jobDescription, question, answer }, 
      'analyze answer'
    )
  }
}

// Create a singleton instance
export const apiService = new ApiService()
