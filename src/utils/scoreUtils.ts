// Score handling utilities
import { SCORE_THRESHOLDS } from '../constants/appConstants'

export const getDisplayScore = (score: number | { overall?: number; clarity?: number } | null | undefined): number => {
  if (typeof score === 'number') return score
  return score?.overall || score?.clarity || 0
}

export const getScoreColor = (score: number): string => {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'text-green-600'
  if (score >= SCORE_THRESHOLDS.GOOD) return 'text-yellow-600'
  return 'text-red-600'
}

export const getScoreLabel = (score: number): string => {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'Excellent'
  if (score >= SCORE_THRESHOLDS.GOOD) return 'Good'
  return 'Needs Improvement'
}
