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
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network error: Unable to connect to server. Please check your internet connection.`)
      }
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
