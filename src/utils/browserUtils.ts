// Browser compatibility utilities

export const isSpeechRecognitionSupported = (): boolean => {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export const getSpeechRecognition = (): typeof SpeechRecognition => {
  return window.SpeechRecognition || window.webkitSpeechRecognition
}

export const isClipboardSupported = (): boolean => {
  return !!(navigator.clipboard && navigator.clipboard.writeText)
}
