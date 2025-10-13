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

  // Add a new segment to the transcription
  private addSegment(segment: TranscriptionSegment): void {
    // Check if we should merge with the last segment
    const lastSegment = this.segments[this.segments.length - 1]
    
    if (lastSegment && this.shouldMergeSegments(lastSegment, segment)) {
      // Merge with the last segment
      lastSegment.text = this.mergeText(lastSegment.text, segment.text)
      lastSegment.endTime = segment.endTime
      lastSegment.confidence = Math.max(lastSegment.confidence, segment.confidence)
      lastSegment.isFinal = segment.isFinal
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

  // Merge text from two segments
  private mergeText(text1: string, text2: string): string {
    if (!text1) return text2
    if (!text2) return text1

    const cleanText1 = text1.trim()
    const cleanText2 = text2.trim()

    // If text2 is a continuation of text1, merge directly
    if (cleanText1.endsWith(' ') || cleanText2.startsWith(' ')) {
      return `${cleanText1} ${cleanText2}`
    }

    // Add space between words
    return `${cleanText1} ${cleanText2}`
  }

  // Clean and normalize text
  private cleanText(text: string): string {
    if (!text) return ''

    let cleaned = text.trim()
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ')
    
    // Add basic punctuation if missing
    if (this.mergeOptions.preservePunctuation) {
      cleaned = this.addBasicPunctuation(cleaned)
    }
    
    return cleaned
  }

  // Add basic punctuation to text
  private addBasicPunctuation(text: string): string {
    if (!text) return text

    let result = text.trim()
    
    // Add period at the end if it doesn't end with punctuation
    if (!/[.!?]$/.test(result)) {
      result += '.'
    }
    
    // Capitalize first letter
    result = result.charAt(0).toUpperCase() + result.slice(1)
    
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

export const calculateTranscriptionMetrics = (
  transcription: ProcessedTranscription
): {
  accuracy: number
  completeness: number
  fluency: number
  overallScore: number
} => {
  const { confidence, wordCount, duration } = transcription
  
  // Calculate accuracy based on confidence
  const accuracy = Math.min(confidence * 100, 100)
  
  // Calculate completeness based on word count and duration
  const expectedWords = Math.max(1, duration / 1000 * 2.5) // 2.5 words per second
  const completeness = Math.min((wordCount / expectedWords) * 100, 100)
  
  // Calculate fluency based on segment continuity
  const segments = transcription.segments
  const gaps = segments.slice(1).map((segment, index) => 
    segment.startTime - segments[index].endTime
  )
  const averageGap = gaps.length > 0 ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0
  const fluency = Math.max(0, 100 - (averageGap / 100)) // Penalize long gaps
  
  // Calculate overall score
  const overallScore = (accuracy * 0.4 + completeness * 0.3 + fluency * 0.3)
  
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

export const extractKeywords = (text: string): string[] => {
  if (!text) return []
  
  // Simple keyword extraction (in a real implementation, this would be more sophisticated)
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 3) // Filter out short words
  
  // Count word frequency
  const wordCount: { [key: string]: number } = {}
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })
  
  // Return most frequent words
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
}

export const detectFillerWords = (text: string): {
  fillerWords: string[]
  count: number
  percentage: number
} => {
  const fillerWordPatterns = [
    /\b(um|uh|er|ah|like|you know|so|well|actually|basically|literally)\b/gi
  ]
  
  const words = text.split(/\s+/)
  const totalWords = words.length
  
  let fillerWords: string[] = []
  let count = 0
  
  fillerWordPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      fillerWords.push(...matches.map(match => match.toLowerCase()))
      count += matches.length
    }
  })
  
  const percentage = totalWords > 0 ? (count / totalWords) * 100 : 0
  
  return {
    fillerWords: [...new Set(fillerWords)], // Remove duplicates
    count,
    percentage: Math.round(percentage * 100) / 100
  }
}

export const calculateSpeakingRate = (
  wordCount: number,
  durationMs: number
): {
  wordsPerMinute: number
  category: 'slow' | 'normal' | 'fast'
} => {
  const durationMinutes = durationMs / (1000 * 60)
  const wordsPerMinute = durationMinutes > 0 ? wordCount / durationMinutes : 0
  
  let category: 'slow' | 'normal' | 'fast'
  if (wordsPerMinute < 120) {
    category = 'slow'
  } else if (wordsPerMinute > 180) {
    category = 'fast'
  } else {
    category = 'normal'
  }
  
  return {
    wordsPerMinute: Math.round(wordsPerMinute),
    category
  }
}

// Create a singleton instance
export const transcriptionProcessor = new TranscriptionProcessor()
