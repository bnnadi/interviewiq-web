import { logger } from './logger'

export interface AudioQualityMetrics {
  volume: number
  noiseLevel: number
  clarity: number
  isGoodQuality: boolean
}

export interface AudioAnalysisResult {
  duration: number
  sampleRate: number
  channels: number
  bitRate: number
  format: string
  quality: AudioQualityMetrics
  peaks: number[]
  rms: number
  dynamicRange: number
}

export interface AudioProcessingOptions {
  targetSampleRate?: number
  targetChannels?: number
  targetBitRate?: number
  enableNoiseReduction?: boolean
  enableNormalization?: boolean
  enableCompression?: boolean
}

export class AudioProcessor {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaStreamAudioSourceNode | null = null

  constructor() {
    this.initializeAudioContext()
  }

  /**
   * Initialize Web Audio API context
   */
  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.8
    } catch (error) {
      logger.error('Failed to initialize audio context:', error)
    }
  }

  /**
   * Get user media with optimal settings
   */
  async getUserMedia(constraints: MediaStreamConstraints = {}): Promise<MediaStream> {
    const defaultConstraints: MediaStreamConstraints = {
      audio: {
        sampleRate: 44100,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    }

    const finalConstraints: MediaStreamConstraints = {
      ...defaultConstraints,
      ...constraints,
      audio: constraints.audio ? {
        ...(defaultConstraints.audio as MediaTrackConstraints || {}),
        ...(constraints.audio as MediaTrackConstraints || {})
      } : (defaultConstraints.audio as MediaTrackConstraints)
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(finalConstraints)
      logger.info('User media access granted')
      return stream
    } catch (error) {
      logger.error('Failed to get user media:', error)
      throw new Error(`Microphone access denied: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Start audio analysis for a stream
   */
  startAnalysis(stream: MediaStream): void {
    if (!this.audioContext || !this.analyser) {
      throw new Error('Audio context not initialized')
    }

    try {
      this.source = this.audioContext.createMediaStreamSource(stream)
      this.source.connect(this.analyser)
      logger.info('Audio analysis started')
          } catch (error) {
      logger.error('Failed to start audio analysis:', error)
      throw error
    }
  }

  /**
   * Stop audio analysis
   */
  stopAnalysis(): void {
    if (this.source) {
      this.source.disconnect()
      this.source = null
    }
    logger.info('Audio analysis stopped')
  }

  /**
   * Get real-time audio quality metrics
   */
  getAudioQualityMetrics(): AudioQualityMetrics {
    if (!this.analyser) {
      return {
        volume: 0,
        noiseLevel: 0,
        clarity: 0,
        isGoodQuality: false
      }
    }

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteFrequencyData(dataArray)

    // Calculate volume (RMS)
    let sum = 0
    for (let i = 0; i < bufferLength; i++) {
      const value = dataArray[i] || 0
      sum += value * value
    }
    const rms = Math.sqrt(sum / bufferLength)
    const volume = rms / 255

    // Calculate noise level (high frequency content)
    const noiseThreshold = 0.1
    let noiseSum = 0
    let noiseCount = 0
    for (let i = Math.floor(bufferLength * 0.7); i < bufferLength; i++) {
      const value = dataArray[i] || 0
      if (value > noiseThreshold * 255) {
        noiseSum += value
        noiseCount++
      }
    }
    const noiseLevel = noiseCount > 0 ? noiseSum / (noiseCount * 255) : 0

    // Calculate clarity (signal-to-noise ratio)
    const signalSum = sum - (noiseSum * noiseSum / noiseCount)
    const clarity = noiseLevel > 0 ? Math.min(signalSum / (noiseSum * noiseSum / noiseCount), 1) : 1

    // Determine if quality is good
    const isGoodQuality = volume > 0.1 && noiseLevel < 0.3 && clarity > 0.5

    return {
      volume,
      noiseLevel,
      clarity,
      isGoodQuality
    }
  }

  /**
   * Analyze audio file
   */
  async analyzeAudioFile(file: File): Promise<AudioAnalysisResult> {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      const url = URL.createObjectURL(file)

      audio.onloadedmetadata = () => {
        try {
          const duration = audio.duration * 1000 // Convert to milliseconds
          const format = file.type
          
          // Create audio context for analysis
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const analyser = audioContext.createAnalyser()
          analyser.fftSize = 2048

          // Load audio data
          const fileReader = new FileReader()
          fileReader.onload = async (e) => {
            try {
              const arrayBuffer = e.target?.result as ArrayBuffer
              const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
              
              const sampleRate = audioBuffer.sampleRate
              const channels = audioBuffer.numberOfChannels
              const bitRate = Math.round((file.size * 8) / duration) // Approximate bit rate
              
              // Analyze audio data
              const peaks: number[] = []
              const channelData = audioBuffer.getChannelData(0)
              const blockSize = Math.floor(channelData.length / 100) // 100 samples
              
              let rmsSum = 0
              let maxPeak = 0
              let minPeak = 0
              
              for (let i = 0; i < channelData.length; i += blockSize) {
                const block = channelData.slice(i, i + blockSize)
                let blockMax = 0
                let blockRms = 0
                
                for (let j = 0; j < block.length; j++) {
                  const sample = Math.abs(block[j] || 0)
                  blockMax = Math.max(blockMax, sample)
                  blockRms += sample * sample
                }
                
                peaks.push(blockMax)
                rmsSum += blockRms / block.length
                maxPeak = Math.max(maxPeak, blockMax)
                minPeak = Math.min(minPeak, -blockMax)
              }
              
              const rms = Math.sqrt(rmsSum / peaks.length)
              const dynamicRange = maxPeak - minPeak
              
              // Calculate quality metrics
              const quality = this.calculateQualityMetrics(peaks, rms, dynamicRange)
              
              const result: AudioAnalysisResult = {
                duration,
                sampleRate,
                channels,
                bitRate,
                format,
                quality,
                peaks,
                rms,
                dynamicRange
              }
              
              URL.revokeObjectURL(url)
              audioContext.close()
              resolve(result)
            } catch (error) {
              logger.error('Failed to analyze audio data:', error)
              reject(error)
            }
          }
          
          fileReader.readAsArrayBuffer(file)
        } catch (error) {
          logger.error('Failed to analyze audio file:', error)
          reject(error)
        }
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load audio file'))
      }

      audio.src = url
    })
  }

  /**
   * Calculate quality metrics from audio data
   */
  private calculateQualityMetrics(peaks: number[], rms: number, dynamicRange: number): AudioQualityMetrics {
    // Calculate volume (normalized RMS)
    const volume = Math.min(rms * 2, 1) // Scale and cap at 1
    
    // Calculate noise level (low-level signal content)
    const noiseThreshold = 0.01
    const noiseCount = peaks.filter(peak => peak < noiseThreshold).length
    const noiseLevel = noiseCount / peaks.length
    
    // Calculate clarity (dynamic range and consistency)
    const avgPeak = peaks.reduce((sum, peak) => sum + peak, 0) / peaks.length
    const clarity = Math.min(dynamicRange / avgPeak, 1)

      // Determine if quality is good
    const isGoodQuality = volume > 0.1 && noiseLevel < 0.5 && clarity > 0.3

      return {
        volume,
        noiseLevel,
        clarity,
        isGoodQuality
    }
  }

  /**
   * Process audio with specified options
   */
  async processAudio(
    input: File | MediaStream,
    options: AudioProcessingOptions = {}
  ): Promise<Blob> {
    const {
      targetSampleRate = 44100,
      targetChannels = 1,
      targetBitRate = 128000,
      enableNoiseReduction = true,
      enableNormalization = true,
      enableCompression = true
    } = options

    try {
      if (input instanceof File) {
        return await this.processAudioFile(input, {
          targetSampleRate,
          targetChannels,
          targetBitRate,
          enableNoiseReduction,
          enableNormalization,
          enableCompression
        })
      } else {
        return await this.processAudioStream(input, {
          targetSampleRate,
          targetChannels,
          targetBitRate,
          enableNoiseReduction,
          enableNormalization,
          enableCompression
        })
      }
    } catch (error) {
      logger.error('Failed to process audio:', error)
      throw error
    }
  }

  /**
   * Process audio file
   */
  private async processAudioFile(
    file: File,
    options: AudioProcessingOptions
  ): Promise<Blob> {
    // For now, return the original file
    // In a real implementation, this would use Web Audio API to process the audio
    logger.info('Processing audio file:', { fileName: file.name, options })
    return file
  }

  /**
   * Process audio stream
   */
  private async processAudioStream(
    stream: MediaStream,
    options: AudioProcessingOptions
  ): Promise<Blob> {
    // For now, return a simple recording
    // In a real implementation, this would use MediaRecorder with specific settings
    logger.info('Processing audio stream:', { options })
    
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: options.targetBitRate || 128000
        })
    
    const chunks: Blob[] = []
    
    return new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        resolve(blob)
      }
      
      mediaRecorder.onerror = (error) => {
        reject(error)
      }
      
      mediaRecorder.start()
      
      // Stop after 5 seconds for demo purposes
      setTimeout(() => {
        mediaRecorder.stop()
      }, 5000)
    })
  }

  /**
   * Convert audio format
   */
  async convertAudioFormat(
    input: File,
    targetFormat: string
  ): Promise<Blob> {
    try {
      logger.info('Converting audio format:', { 
        inputFormat: input.type, 
        targetFormat 
      })
      
      // For now, return the original file
      // In a real implementation, this would use Web Audio API to convert formats
      return input
    } catch (error) {
      logger.error('Failed to convert audio format:', error)
      throw error
    }
  }

  /**
   * Get supported audio formats
   */
  getSupportedFormats(): string[] {
    const formats = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg']
    
    // Check for additional supported formats
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      formats.push('audio/webm;codecs=opus')
      }
    
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
      formats.push('audio/mp4')
    }
    
    return formats
  }

  /**
   * Check if format is supported
   */
  isFormatSupported(format: string): boolean {
    return this.getSupportedFormats().includes(format)
  }

  /**
   * Get optimal recording settings
   */
  getOptimalRecordingSettings(): MediaRecorderOptions {
    const formats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav'
    ]
    
    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format)) {
        return {
          mimeType: format,
          audioBitsPerSecond: 128000
        }
      }
    }
    
    return {
      audioBitsPerSecond: 128000
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopAnalysis()
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
    
    this.audioContext = null
    this.analyser = null
    this.source = null
  }
}

// Create singleton instance
export const audioProcessor = new AudioProcessor()

// Utility functions
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const validateAudioFile = (file: File, maxSizeMB: number = 50): string | null => {
  const supportedTypes = [
    'audio/webm',
    'audio/wav',
    'audio/mp3',
    'audio/m4a',
    'audio/ogg',
    'audio/mp4'
  ]
  
  if (!supportedTypes.includes(file.type)) {
    return `Unsupported file type. Supported types: ${supportedTypes.join(', ')}`
  }
  
  if (file.size > maxSizeMB * 1024 * 1024) {
    return `File size must be less than ${maxSizeMB}MB`
  }
  
  return null
}