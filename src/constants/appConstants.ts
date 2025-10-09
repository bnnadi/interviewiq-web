// Application constants
export const VIEWS = {
  JOB_INPUT: 'job-input',
  QUESTION_LIST: 'question-list',
  ANSWER_RECORDER: 'answer-recorder',
  FEEDBACK: 'feedback'
} as const

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
export type ViewType = typeof VIEWS[keyof typeof VIEWS]
export type ScoreThreshold = typeof SCORE_THRESHOLDS[keyof typeof SCORE_THRESHOLDS]
