// Application constants

export const SCORE_THRESHOLDS = {
  EXCELLENT: 8,
  GOOD: 6
} as const

export const SPEECH_RECOGNITION_CONFIG = {
  lang: 'en-US',
  continuous: true,
  interimResults: true,
  maxAlternatives: 1
} as const

// Type definitions
export type ScoreThreshold = typeof SCORE_THRESHOLDS[keyof typeof SCORE_THRESHOLDS]
