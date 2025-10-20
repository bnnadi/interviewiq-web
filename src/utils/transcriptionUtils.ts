import { SpeechTranscriptionResult, SpeechAnalysisResult } from '../services/speechApiService'
import { logger } from './logger'

export interface TranscriptionSegment {
  text: string
  startTime: number
  endTime: number
  confidence: number
  isFinal: boolean
}

export interface ProcessedTranscription {
  fullText: string
  segments: TranscriptionSegment[]
  confidence: number
  wordCount: number
  duration: number
  analysis?: SpeechAnalysisResult
}

export interface TranscriptionMergeOptions {
  maxGap: number // Maximum gap between segments to merge (in ms)
  minConfidence: number // Minimum confidence to include segment
  preservePunctuation: boolean
}

export class TranscriptionProcessor {
  private segments: TranscriptionSegment[] = []
  private lastUpdateTime = 0
  private mergeOptions: TranscriptionMergeOptions = {
    maxGap: 2000, // 2 seconds
    minConfidence: 0.3,
    preservePunctuation: true
  }

  constructor(options?: Partial<TranscriptionMergeOptions>) {
    this.mergeOptions = { ...this.mergeOptions, ...options }
  }

  // Process incoming transcription result
  processTranscriptionResult(
    result: SpeechTranscriptionResult,
    startTime: number = 0
  ): ProcessedTranscription {
    const currentTime = Date.now()
    const segment: TranscriptionSegment = {
      text: this.cleanText(result.transcript),
      startTime: startTime + (result.timestamp - this.lastUpdateTime),
      endTime: startTime + (result.timestamp - this.lastUpdateTime) + this.estimateDuration(result.transcript),
      confidence: result.confidence,
      isFinal: result.isFinal
    }

    if (segment.confidence >= this.mergeOptions.minConfidence) {
      this.addSegment(segment)
    }

    this.lastUpdateTime = result.timestamp

    return this.getProcessedTranscription()
  }

  // Extract segment merging logic
  private mergeSegments(segment1: TranscriptionSegment, segment2: TranscriptionSegment): TranscriptionSegment {
    return {
      ...segment1,
      text: this.mergeText(segment1.text, segment2.text),
      endTime: segment2.endTime,
      confidence: Math.max(segment1.confidence, segment2.confidence),
      isFinal: segment2.isFinal
    }
  }

  // Add a new segment to the transcription
  private addSegment(segment: TranscriptionSegment): void {
    const lastSegment = this.segments[this.segments.length - 1]
    
    if (lastSegment && this.shouldMergeSegments(lastSegment, segment)) {
      // Merge with the last segment
      this.segments[this.segments.length - 1] = this.mergeSegments(lastSegment, segment)
    } else {
      // Add as new segment
      this.segments.push(segment)
    }
  }

  // Check if two segments should be merged
  private shouldMergeSegments(segment1: TranscriptionSegment, segment2: TranscriptionSegment): boolean {
    const gap = segment2.startTime - segment1.endTime
    return gap <= this.mergeOptions.maxGap && !segment1.isFinal
  }

  // Extract text merging logic
  private shouldAddSpace(text1: string, text2: string): boolean {
    const cleanText1 = text1.trim()
    const cleanText2 = text2.trim()
    return !cleanText1.endsWith(' ') && !cleanText2.startsWith(' ')
  }

  // Merge text from two segments
  private mergeText(text1: string, text2: string): string {
    if (!text1) return text2
    if (!text2) return text1

    const cleanText1 = text1.trim()
    const cleanText2 = text2.trim()
    const needsSpace = this.shouldAddSpace(cleanText1, cleanText2)

    return needsSpace ? `${cleanText1} ${cleanText2}` : `${cleanText1}${cleanText2}`
  }

  // Extract text normalization logic
  private normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ')
  }

  // Clean and normalize text
  private cleanText(text: string): string {
    if (!text) return ''

    let cleaned = text.trim()
    cleaned = this.normalizeWhitespace(cleaned)
    
    if (this.mergeOptions.preservePunctuation) {
      cleaned = this.addBasicPunctuation(cleaned)
    }
    
    return cleaned
  }

  // Extract punctuation logic
  private needsEndPunctuation(text: string): boolean {
    return !/[.!?]$/.test(text.trim())
  }

  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  // Add basic punctuation to text
  private addBasicPunctuation(text: string): string {
    if (!text) return text

    let result = text.trim()
    
    if (this.needsEndPunctuation(result)) {
      result += '.'
    }
    
    result = this.capitalizeFirstLetter(result)
    
    return result
  }

  // Estimate duration of text based on average speaking rate
  private estimateDuration(text: string): number {
    const wordsPerMinute = 150 // Average speaking rate
    const wordCount = text.split(/\s+/).length
    return (wordCount / wordsPerMinute) * 60 * 1000 // Convert to milliseconds
  }

  // Get processed transcription
  getProcessedTranscription(): ProcessedTranscription {
    const fullText = this.segments
      .filter(segment => segment.isFinal)
      .map(segment => segment.text)
      .join(' ')

    const finalSegments = this.segments.filter(segment => segment.isFinal)
    const averageConfidence = finalSegments.length > 0
      ? finalSegments.reduce((sum, segment) => sum + segment.confidence, 0) / finalSegments.length
      : 0

    const wordCount = fullText.split(/\s+/).filter(word => word.length > 0).length
    const duration = finalSegments.length > 0
      ? finalSegments[finalSegments.length - 1].endTime - finalSegments[0].startTime
      : 0

    return {
      fullText,
      segments: finalSegments,
      confidence: averageConfidence,
      wordCount,
      duration
    }
  }

  // Get interim transcription (non-final segments)
  getInterimTranscription(): string {
    return this.segments
      .filter(segment => !segment.isFinal)
      .map(segment => segment.text)
      .join(' ')
  }

  // Clear all segments
  clear(): void {
    this.segments = []
    this.lastUpdateTime = 0
  }

  // Get segments by time range
  getSegmentsByTimeRange(startTime: number, endTime: number): TranscriptionSegment[] {
    return this.segments.filter(segment => 
      segment.startTime >= startTime && segment.endTime <= endTime
    )
  }

  // Get segments by confidence threshold
  getSegmentsByConfidence(minConfidence: number): TranscriptionSegment[] {
    return this.segments.filter(segment => segment.confidence >= minConfidence)
  }
}

// Utility functions for transcription processing
export const mergeTranscriptions = (
  transcriptions: SpeechTranscriptionResult[]
): ProcessedTranscription => {
  const processor = new TranscriptionProcessor()
  
  transcriptions.forEach(result => {
    processor.processTranscriptionResult(result)
  })
  
  return processor.getProcessedTranscription()
}

// Extract metrics calculation helpers
const calculateAccuracy = (confidence: number): number => {
  return Math.min(confidence * 100, 100)
}

const calculateCompleteness = (wordCount: number, duration: number): number => {
  const expectedWords = Math.max(1, duration / 1000 * 2.5) // 2.5 words per second
  return Math.min((wordCount / expectedWords) * 100, 100)
}

const calculateFluency = (segments: TranscriptionSegment[]): number => {
  if (segments.length <= 1) return 100
  
  const gaps = segments.slice(1).map((segment, index) => 
    segment.startTime - segments[index].endTime
  )
  const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
  return Math.max(0, 100 - (averageGap / 100)) // Penalize long gaps
}

const calculateOverallScore = (accuracy: number, completeness: number, fluency: number): number => {
  return (accuracy * 0.4 + completeness * 0.3 + fluency * 0.3)
}

export const calculateTranscriptionMetrics = (
  transcription: ProcessedTranscription
): {
  accuracy: number
  completeness: number
  fluency: number
  overallScore: number
} => {
  const { confidence, wordCount, duration, segments } = transcription
  
  const accuracy = calculateAccuracy(confidence)
  const completeness = calculateCompleteness(wordCount, duration)
  const fluency = calculateFluency(segments)
  const overallScore = calculateOverallScore(accuracy, completeness, fluency)
  
  return {
    accuracy: Math.round(accuracy),
    completeness: Math.round(completeness),
    fluency: Math.round(fluency),
    overallScore: Math.round(overallScore)
  }
}

export const formatTranscriptionForDisplay = (
  transcription: ProcessedTranscription,
  showConfidence: boolean = false
): string => {
  let result = transcription.fullText
  
  if (showConfidence && transcription.confidence > 0) {
    result += ` (${Math.round(transcription.confidence * 100)}% confidence)`
  }
  
  return result
}

// Extract keyword processing helpers
const preprocessText = (text: string): string[] => {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 3) // Filter out short words
}

const countWordFrequency = (words: string[]): { [key: string]: number } => {
  const wordCount: { [key: string]: number } = {}
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })
  return wordCount
}

const getTopWords = (wordCount: { [key: string]: number }, limit: number = 10): string[] => {
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([word]) => word)
}

export const extractKeywords = (text: string): string[] => {
  if (!text) return []
  
  const words = preprocessText(text)
  const wordCount = countWordFrequency(words)
  return getTopWords(wordCount)
}

// Extract filler word detection helpers
const FILLER_WORD_PATTERNS = [
  /\b(um|uh|er|ah|like|you know|so|well|actually|basically|literally)\b/gi
]

const findFillerMatches = (text: string): string[] => {
  const matches: string[] = []
  FILLER_WORD_PATTERNS.forEach(pattern => {
    const patternMatches = text.match(pattern)
    if (patternMatches) {
      matches.push(...patternMatches.map(match => match.toLowerCase()))
    }
  })
  return matches
}

const calculateFillerPercentage = (count: number, totalWords: number): number => {
  return totalWords > 0 ? (count / totalWords) * 100 : 0
}

export const detectFillerWords = (text: string): {
  fillerWords: string[]
  count: number
  percentage: number
} => {
  const words = text.split(/\s+/)
  const totalWords = words.length
  const fillerMatches = findFillerMatches(text)
  const count = fillerMatches.length
  const percentage = calculateFillerPercentage(count, totalWords)
  
  return {
    fillerWords: [...new Set(fillerMatches)], // Remove duplicates
    count,
    percentage: Math.round(percentage * 100) / 100
  }
}

// Extract speaking rate calculation helpers
const calculateWordsPerMinute = (wordCount: number, durationMs: number): number => {
  const durationMinutes = durationMs / (1000 * 60)
  return durationMinutes > 0 ? wordCount / durationMinutes : 0
}

const categorizeSpeakingRate = (wordsPerMinute: number): 'slow' | 'normal' | 'fast' => {
  if (wordsPerMinute < 120) return 'slow'
  if (wordsPerMinute > 180) return 'fast'
  return 'normal'
}

export const calculateSpeakingRate = (
  wordCount: number,
  durationMs: number
): {
  wordsPerMinute: number
  category: 'slow' | 'normal' | 'fast'
} => {
  const wordsPerMinute = calculateWordsPerMinute(wordCount, durationMs)
  const category = categorizeSpeakingRate(wordsPerMinute)
  
  return {
    wordsPerMinute: Math.round(wordsPerMinute),
    category
  }
}

// Create a singleton instance
export const transcriptionProcessor = new TranscriptionProcessor()
