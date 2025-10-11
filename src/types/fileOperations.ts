// File Operations and Speech Integration Types

export type FileType = 'audio' | 'document' | 'image'
export type FileStatus = 'uploading' | 'processing' | 'completed' | 'failed' | 'deleted'

export interface FileUploadResponse {
  file_id: string
  filename: string
  file_type: FileType
  file_size: number
  mime_type: string
  status: FileStatus
  upload_url: string
  created_at: string
  expires_at: string | null
  metadata: {
    description?: string
    uploaded_by?: string
    file_hash?: string
  }
}

export interface FileInfo {
  file_id: string
  filename: string
  file_type: FileType
  file_size: number
  mime_type: string
  status: FileStatus
  upload_url: string
  created_at: string
  expires_at: string | null
  metadata: Record<string, any> | null
  processing_result: any | null
}

export interface FileListResponse {
  files: FileInfo[]
  total_count: number
  page: number
  page_size: number
  has_next: boolean
}

export interface FileDeleteResponse {
  file_id: string
  message: string
  deleted_at: string
}

export interface FileUploadRequest {
  file: File
  file_type: FileType
  description?: string
}

export interface FileListRequest {
  file_type?: FileType
  page?: number
  page_size?: number
}

export interface FileDownloadRequest {
  file_id: string
}

// Speech Integration Types
export interface TranscriptionResponse {
  transcription: string
  language: string
  confidence: number
  file_id: string | null
  metadata: {
    filename: string
    mime_type: string
    file_size: number
    saved: boolean
  }
}

export interface TranscriptionRequest {
  audio_file: File
  language?: string
  save_file?: boolean
}

export interface TranscriptionFromFileRequest {
  file_id: string
  language?: string
}

export interface SupportedFormat {
  format: string
  mime_type: string
  extension: string
  max_size: string
}

export interface SupportedFormatsResponse {
  formats: SupportedFormat[]
  supported_languages: string[]
}

export interface AudioFileInfo {
  file_id: string
  filename: string
  file_size: number
  created_at: string
  status: FileStatus
}

export interface AudioFileListRequest {
  page?: number
  page_size?: number
}

// Error Response
export interface ApiErrorResponse {
  detail: string
  status_code: number
}

// File Size Limits
export const FILE_SIZE_LIMITS = {
  audio: 50 * 1024 * 1024, // 50MB
  document: 10 * 1024 * 1024, // 10MB
  image: 5 * 1024 * 1024, // 5MB
} as const

// Supported File Formats
export const SUPPORTED_FORMATS = {
  audio: ['mp3', 'wav', 'm4a', 'ogg', 'flac'],
  document: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
} as const

// MIME Types
export const MIME_TYPES = {
  audio: {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'm4a': 'audio/mp4',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
  },
  document: {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'rtf': 'application/rtf',
  },
  image: {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
  },
} as const

// Utility functions
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export const getFileTypeFromExtension = (extension: string): FileType | null => {
  const ext = extension.toLowerCase()
  if (SUPPORTED_FORMATS.audio.includes(ext)) return 'audio'
  if (SUPPORTED_FORMATS.document.includes(ext)) return 'document'
  if (SUPPORTED_FORMATS.image.includes(ext)) return 'image'
  return null
}

export const getMimeType = (fileType: FileType, extension: string): string | null => {
  const ext = extension.toLowerCase()
  return MIME_TYPES[fileType][ext as keyof typeof MIME_TYPES[typeof fileType]] || null
}

export const validateFileSize = (file: File, fileType: FileType): boolean => {
  return file.size <= FILE_SIZE_LIMITS[fileType]
}

export const validateFileType = (file: File): FileType | null => {
  const extension = getFileExtension(file.name)
  return getFileTypeFromExtension(extension)
}
