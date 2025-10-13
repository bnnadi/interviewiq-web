import { logger } from './logger'

export interface AudioConfig {
  sampleRate: number
  channels: number
  bitRate: number
  format: string
}

export interface AudioChunk {
  data: ArrayBuffer
  timestamp: number
  duration: number
  sampleRate: number
}

export interface AudioQualityMetrics {
  volume: number
  noiseLevel: number
  clarity: number
  isGoodQuality: boolean
}

export class AudioProcessor {
  private audioContext: AudioContext | null = null
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: AudioChunk[] = []
  private isRecording = false
  private chunkSize = 3000 // 3 seconds in milliseconds

  constructor() {
    this.initializeAudioContext()
  }

  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      logger.info('Audio context initialized')
    } catch (error) {
      logger.error('Failed to initialize audio context:', error)
    }
  }

  // Get user media with optimal settings
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
      } : defaultConstraints.audio
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

  // Start recording with chunked processing
  async startRecording(
    onChunk: (chunk: AudioChunk) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    if (this.isRecording) {
      logger.warn('Recording already in progress')
      return
    }

    try {
      const stream = await this.getUserMedia()
      
      // Check if MediaRecorder is supported
      if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        throw new Error('Audio recording not supported in this browser')
      }

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      })

      this.audioChunks = []
      this.isRecording = true

      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          try {
            const arrayBuffer = await event.data.arrayBuffer()
            const chunk: AudioChunk = {
              data: arrayBuffer,
              timestamp: Date.now(),
              duration: this.chunkSize,
              sampleRate: 44100
            }
            this.audioChunks.push(chunk)
            onChunk(chunk)
          } catch (error) {
            logger.error('Failed to process audio chunk:', error)
          }
        }
      }

      this.mediaRecorder.onerror = (event) => {
        const error = new Error(`MediaRecorder error: ${event}`)
        logger.error('MediaRecorder error:', error)
        onError(error)
      }

      this.mediaRecorder.onstop = () => {
        this.isRecording = false
        logger.info('Recording stopped')
      }

      // Start recording with time slices for chunked processing
      this.mediaRecorder.start(this.chunkSize)
      logger.info('Recording started with chunked processing')

    } catch (error) {
      this.isRecording = false
      logger.error('Failed to start recording:', error)
      onError(error instanceof Error ? error : new Error('Failed to start recording'))
    }
  }

  // Stop recording
  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording to stop'))
        return
      }

      this.mediaRecorder.onstop = () => {
        this.isRecording = false
        
        // Combine all chunks into a single blob
        const audioBlob = new Blob(this.audioChunks.map(chunk => chunk.data), {
          type: 'audio/webm;codecs=opus'
        })
        
        logger.info('Recording stopped, created audio blob')
        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
      
      // Stop all tracks to release microphone
      if (this.mediaRecorder?.stream) {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop())
      }
    })
  }

  // Analyze audio quality in real-time
  async analyzeAudioQuality(audioData: ArrayBuffer): Promise<AudioQualityMetrics> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized')
    }

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData)
      const channelData = audioBuffer.getChannelData(0)
      
      // Calculate volume (RMS)
      let sum = 0
      for (let i = 0; i < channelData.length; i++) {
        const sample = channelData[i]
        sum += sample * sample
      }
      const volume = Math.sqrt(sum / channelData.length)

      // Calculate noise level (high frequency content)
      const noiseLevel = this.calculateNoiseLevel(channelData)

      // Calculate clarity (signal-to-noise ratio)
      const clarity = volume > 0 ? Math.max(0, Math.min(1, volume / (noiseLevel + 0.001))) : 0

      // Determine if quality is good
      const isGoodQuality = volume > 0.01 && clarity > 0.3 && noiseLevel < 0.5

      return {
        volume,
        noiseLevel,
        clarity,
        isGoodQuality
      }
    } catch (error) {
      logger.error('Failed to analyze audio quality:', error)
      return {
        volume: 0,
        noiseLevel: 1,
        clarity: 0,
        isGoodQuality: false
      }
    }
  }

  private calculateNoiseLevel(channelData: Float32Array): number {
    // Simple noise detection based on high-frequency content
    let highFreqSum = 0
    const sampleRate = 44100
    const highFreqStart = Math.floor(channelData.length * 0.7) // Last 30% of frequencies
    
    for (let i = highFreqStart; i < channelData.length; i++) {
      highFreqSum += Math.abs(channelData[i])
    }
    
    return highFreqSum / (channelData.length - highFreqStart)
  }

  // Convert audio format
  async convertAudioFormat(
    audioBlob: Blob,
    targetFormat: string,
    targetSampleRate?: number
  ): Promise<Blob> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized')
    }

    try {
      const arrayBuffer = await audioBlob.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      
      // If target sample rate is specified and different, resample
      if (targetSampleRate && audioBuffer.sampleRate !== targetSampleRate) {
        const resampledBuffer = await this.resampleAudio(audioBuffer, targetSampleRate)
        return this.audioBufferToBlob(resampledBuffer, targetFormat)
      }
      
      return this.audioBufferToBlob(audioBuffer, targetFormat)
    } catch (error) {
      logger.error('Failed to convert audio format:', error)
      throw new Error(`Audio format conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async resampleAudio(audioBuffer: AudioBuffer, targetSampleRate: number): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio context not initialized')
    }

    const sourceSampleRate = audioBuffer.sampleRate
    const ratio = targetSampleRate / sourceSampleRate
    const newLength = Math.floor(audioBuffer.length * ratio)
    
    const newBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      newLength,
      targetSampleRate
    )

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const sourceData = audioBuffer.getChannelData(channel)
      const targetData = newBuffer.getChannelData(channel)
      
      for (let i = 0; i < newLength; i++) {
        const sourceIndex = i / ratio
        const index = Math.floor(sourceIndex)
        const fraction = sourceIndex - index
        
        if (index + 1 < sourceData.length) {
          // Linear interpolation
          targetData[i] = sourceData[index] * (1 - fraction) + sourceData[index + 1] * fraction
        } else {
          targetData[i] = sourceData[index] || 0
        }
      }
    }

    return newBuffer
  }

  private audioBufferToBlob(audioBuffer: AudioBuffer, format: string): Blob {
    const length = audioBuffer.length
    const channels = audioBuffer.numberOfChannels
    
    // Convert to WAV format (simplified)
    if (format === 'wav') {
      const buffer = new ArrayBuffer(44 + length * channels * 2)
      const view = new DataView(buffer)
      
      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i))
        }
      }
      
      writeString(0, 'RIFF')
      view.setUint32(4, 36 + length * channels * 2, true)
      writeString(8, 'WAVE')
      writeString(12, 'fmt ')
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true)
      view.setUint16(22, channels, true)
      view.setUint32(24, audioBuffer.sampleRate, true)
      view.setUint32(28, audioBuffer.sampleRate * channels * 2, true)
      view.setUint16(32, channels * 2, true)
      view.setUint16(34, 16, true)
      writeString(36, 'data')
      view.setUint32(40, length * channels * 2, true)
      
      // Convert float32 to int16
      let offset = 44
      for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < channels; channel++) {
          const channelData = audioBuffer.getChannelData(channel)
          const sample = Math.max(-1, Math.min(1, channelData[i]))
          view.setInt16(offset, sample * 0x7FFF, true)
          offset += 2
        }
      }
      
      return new Blob([buffer], { type: 'audio/wav' })
    }
    
    // For other formats, return original blob (would need more complex conversion)
    throw new Error(`Unsupported audio format: ${format}`)
  }

  // Get optimal audio configuration for the current device
  async getOptimalAudioConfig(): Promise<AudioConfig> {
    try {
      const stream = await this.getUserMedia()
      const audioTracks = stream.getAudioTracks()
      
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks available')
      }

      const settings = audioTracks[0]?.getSettings()
      
      return {
        sampleRate: settings?.sampleRate ?? 44100,
        channels: settings?.channelCount ?? 1,
        bitRate: 128000, // Default bitrate
        format: 'webm'
      }
    } catch (error) {
      logger.error('Failed to get optimal audio config:', error)
      return {
        sampleRate: 44100,
        channels: 1,
        bitRate: 128000,
        format: 'webm'
      }
    }
  }

  // Check if audio recording is supported
  isAudioRecordingSupported(): boolean {
    return !!(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      typeof MediaRecorder !== 'undefined' &&
      MediaRecorder.isTypeSupported?.('audio/webm;codecs=opus')
    )
  }

  // Get supported audio formats
  getSupportedFormats(): string[] {
    const formats = []
    if (typeof MediaRecorder !== 'undefined') {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        formats.push('webm')
      }
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        formats.push('mp4')
      }
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        formats.push('wav')
      }
    }
    return formats
  }

  // Cleanup resources
  cleanup(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }
    
    this.audioChunks = []
    this.isRecording = false
  }
}

// Create a singleton instance
export const audioProcessor = new AudioProcessor()

// Utility functions
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

export const validateAudioFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/m4a', 'audio/ogg']
  const maxSize = 25 * 1024 * 1024 // 25MB
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported types: ${allowedTypes.join(', ')}`
    }
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large: ${formatFileSize(file.size)}. Maximum size: ${formatFileSize(maxSize)}`
    }
  }
  
  return { valid: true }
}
