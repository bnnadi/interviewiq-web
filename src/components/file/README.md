# File Operations & Speech Integration

This directory contains comprehensive file operations and speech integration components for the InterviewIQ application.

## Overview

The file and speech integration provides a complete solution for:
- File upload, management, and processing
- Audio recording and transcription
- Multi-language speech recognition
- File type validation and size limits
- Error handling and retry logic

## Components

### File Components

#### `FileUpload.tsx`
A drag-and-drop file upload component with:
- Support for audio, document, and image files
- File type and size validation
- Upload progress tracking
- Error handling and user feedback
- Multiple file selection support

**Usage:**
```tsx
<FileUpload
  fileType="audio"
  onUploadSuccess={(fileId, filename) => console.log('Uploaded:', filename)}
  onUploadError={(error) => console.error('Upload failed:', error)}
  description="Upload your audio file"
  maxFiles={1}
/>
```

#### `FileManager.tsx`
A comprehensive file management component with:
- File listing with pagination
- File type filtering
- Download and delete operations
- File selection and preview
- Status indicators

**Usage:**
```tsx
<FileManager
  fileType="audio"
  onFileSelect={(file) => console.log('Selected:', file)}
  onFileDelete={(fileId) => console.log('Deleted:', fileId)}
  showActions={true}
  pageSize={20}
/>
```

### Speech Components

#### `SpeechTranscriber.tsx`
An audio file transcription component with:
- Drag-and-drop audio file upload
- Multiple language support
- Auto-transcription option
- Confidence scoring
- Progress tracking

**Usage:**
```tsx
<SpeechTranscriber
  onTranscriptionComplete={(text, confidence) => console.log('Transcribed:', text)}
  onTranscriptionError={(error) => console.error('Transcription failed:', error)}
  autoTranscribe={true}
/>
```

#### `EnhancedAudioRecorder.tsx`
A real-time audio recording component with:
- Browser-based audio recording
- Recording controls (start, pause, resume, stop)
- Auto-transcription after recording
- Audio playback
- Duration limits

**Usage:**
```tsx
<EnhancedAudioRecorder
  onTranscriptionComplete={(text, confidence) => console.log('Recorded:', text)}
  onTranscriptionError={(error) => console.error('Recording failed:', error)}
  autoTranscribe={true}
  maxDuration={300}
/>
```

### Integration Component

#### `FileAndSpeechIntegration.tsx`
A comprehensive integration component that combines all file and speech functionality:
- Tabbed interface for different operations
- File upload and management
- Audio transcription
- Real-time recording
- Transcription history

**Usage:**
```tsx
<FileAndSpeechIntegration
  onFileSelected={(file) => console.log('File selected:', file)}
  onTranscriptionComplete={(text, confidence) => console.log('Transcribed:', text)}
/>
```

## Services

### FileService
Handles all file operations including:
- File upload (general and type-specific)
- File retrieval and download
- File listing with pagination
- File deletion
- Error handling and retry logic

### SpeechService
Manages speech processing including:
- Audio file transcription
- Real-time audio processing
- Language detection and support
- Confidence scoring
- Format validation

## Types

### File Operations Types
- `FileType`: 'audio' | 'document' | 'image'
- `FileStatus`: 'uploading' | 'processing' | 'completed' | 'failed' | 'deleted'
- `FileUploadResponse`: Upload response structure
- `FileInfo`: File information structure
- `FileListResponse`: Paginated file list response

### Speech Integration Types
- `TranscriptionResponse`: Transcription result structure
- `TranscriptionRequest`: Transcription request parameters
- `SupportedFormatsResponse`: Supported audio formats and languages

## API Endpoints

### File Operations
- `POST /api/v1/files/upload` - Upload files
- `GET /api/v1/files` - List files
- `GET /api/v1/files/{id}` - Get file info
- `GET /api/v1/files/{id}/download` - Download file
- `DELETE /api/v1/files/{id}` - Delete file
- Type-specific endpoints for audio, documents, images

### Speech Integration
- `POST /api/v1/speech/transcribe` - Transcribe audio
- `POST /api/v1/speech/transcribe/{id}` - Transcribe saved file
- `GET /api/v1/speech/supported-formats` - Get supported formats
- `GET /api/v1/speech/audio-files` - List audio files

## Features

### File Management
- ✅ Drag & drop file upload
- ✅ Multiple file type support (audio, document, image)
- ✅ File size validation (50MB audio, 10MB documents, 5MB images)
- ✅ Upload progress tracking
- ✅ File listing with pagination
- ✅ Download and delete operations
- ✅ File type filtering
- ✅ Error handling and retry logic

### Speech Processing
- ✅ Audio file transcription
- ✅ Real-time audio recording
- ✅ Multiple language support (10+ languages)
- ✅ Confidence scoring
- ✅ Auto-transcription option
- ✅ Audio playback controls
- ✅ Format validation (MP3, WAV, M4A, OGG, FLAC)

### Integration
- ✅ Seamless API integration
- ✅ Network status monitoring
- ✅ TypeScript support
- ✅ Responsive design
- ✅ Accessibility features
- ✅ Error handling and user feedback

## Demo

Visit `/demo/files-speech` to see the complete file and speech integration in action.

## Error Handling

All components include comprehensive error handling:
- Network connectivity checks
- File validation errors
- API error responses
- User-friendly error messages
- Retry logic for transient failures

## Accessibility

Components are built with accessibility in mind:
- Keyboard navigation support
- Screen reader compatibility
- ARIA labels and descriptions
- Focus management
- High contrast support

## Browser Support

- Modern browsers with WebRTC support for recording
- File API support for uploads
- MediaRecorder API for audio recording
- Fetch API for HTTP requests
