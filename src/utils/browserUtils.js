// Browser compatibility utilities
export const isSpeechRecognitionSupported = () => {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export const getSpeechRecognition = () => {
  return window.SpeechRecognition || window.webkitSpeechRecognition
}

export const isClipboardSupported = () => {
  return !!(navigator.clipboard && navigator.clipboard.writeText)
}
