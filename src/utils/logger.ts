// Logging utility for development and production
export const logger = {
  info: (message: string, data?: unknown): void => {
    if (import.meta.env.DEV) {
      console.log(message, data)
    }
  },
  
  error: (message: string, error?: unknown): void => {
    console.error(message, error)
  },
  
  warn: (message: string, data?: unknown): void => {
    if (import.meta.env.DEV) {
      console.warn(message, data)
    }
  }
}
