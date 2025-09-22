class SpeechService {
    constructor() {
      this.ws = null
      this.mediaRecorder = null
      this.audioContext = null
      this.isRecording = false
    }
  
    async startRecording(onTranscript, onError) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        
        // Initialize WebSocket connection to your backend
        this.ws = new WebSocket('ws://localhost:8000/ws/speech')
        
        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data)
          if (data.transcript) {
            onTranscript(data.transcript, data.isFinal)
          }
        }
  
        this.ws.onerror = (error) => {
          onError('WebSocket error: ' + error.message)
        }
  
        // Start recording audio
        this.mediaRecorder = new MediaRecorder(stream)
        this.mediaRecorder.ondataavailable = (event) => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(event.data)
          }
        }
  
        this.mediaRecorder.start(100) // Send data every 100ms
        this.isRecording = true
      } catch (error) {
        onError('Failed to start recording: ' + error.message)
      }
    }
  
    stopRecording() {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop()
        this.mediaRecorder = null
      }
      
      if (this.ws) {
        this.ws.close()
        this.ws = null
      }
      
      this.isRecording = false
    }
  }
  
  export default SpeechService