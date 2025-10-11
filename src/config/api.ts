// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  ENDPOINTS: {
    parseJD: '/api/v1/parse-jd',
    analyzeAnswer: '/api/v1/analyze-answer',
    services: '/api/v1/services',
    // File Operations
    files: {
      upload: '/api/v1/files/upload',
      get: '/api/v1/files',
      download: '/api/v1/files',
      delete: '/api/v1/files',
      // Type-specific uploads
      audioUpload: '/api/v1/files/audio/upload',
      documentUpload: '/api/v1/files/documents/upload',
      imageUpload: '/api/v1/files/images/upload',
      // Type-specific lists
      audioList: '/api/v1/files/audio',
      documentList: '/api/v1/files/documents',
      imageList: '/api/v1/files/images',
    },
    // Speech Integration
    speech: {
      transcribe: '/api/v1/speech/transcribe',
      transcribeFromFile: '/api/v1/speech/transcribe',
      supportedFormats: '/api/v1/speech/supported-formats',
      audioFiles: '/api/v1/speech/audio-files',
    }
  }
} as const

export interface ApiEndpoints {
  parseJD: string
  analyzeAnswer: string
  services: string
  files: {
    upload: string
    get: string
    download: string
    delete: string
    audioUpload: string
    documentUpload: string
    imageUpload: string
    audioList: string
    documentList: string
    imageList: string
  }
  speech: {
    transcribe: string
    transcribeFromFile: string
    supportedFormats: string
    audioFiles: string
  }
}

export interface ApiConfig {
  BASE_URL: string
  ENDPOINTS: ApiEndpoints
}
