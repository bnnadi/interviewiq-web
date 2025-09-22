// Logging utility for development and production
export const logger = {
  info: (message, data) => {
    if (import.meta.env.DEV) {
      console.log(message, data)
    }
  },
  
  error: (message, error) => {
    console.error(message, error)
  },
  
  warn: (message, data) => {
    if (import.meta.env.DEV) {
      console.warn(message, data)
    }
  }
}
