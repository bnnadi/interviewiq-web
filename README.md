# InterviewIQ Web App

AI-powered interview coaching web application with voice recording and intelligent feedback.

## Features

### 🎯 **JD-Aware Question Generation**
- Paste job descriptions to get personalized interview questions
- AI analyzes JD requirements and generates relevant questions
- Questions tailored to specific roles and responsibilities

### 🎤 **Voice Recording & Transcription**
- Real-time speech-to-text using browser SpeechRecognition API
- Live transcript display while speaking
- Support for continuous recording with pause/resume

### 🤖 **AI-Powered Feedback**
- Comprehensive answer analysis with scoring (1-10)
- Identifies missing keywords from job description
- Provides specific improvement suggestions
- Shows ideal answer examples

### 📱 **Modern UI/UX**
- Clean, responsive design with Tailwind CSS
- Intuitive flow: JD Input → Questions → Recording → Feedback
- Mobile-friendly interface
- Loading states and error handling

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Speech Recognition**: Web Speech API
- **State Management**: React Hooks (useState, useEffect)
- **HTTP Client**: Fetch API

## Project Structure

```
interview-coach-web/
├── src/
│   ├── components/
│   │   ├── JobInput.jsx          # JD input form
│   │   ├── QuestionList.jsx      # Display generated questions
│   │   ├── AnswerRecorder.jsx    # Voice recording interface
│   │   └── FeedbackView.jsx      # AI feedback display
│   ├── App.jsx                   # Main app with state management
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Tailwind CSS imports
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd interview-coach-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
```

## Usage Flow

1. **Job Description Input**
   - Enter role title (e.g., "Senior Software Engineer")
   - Paste complete job description
   - Click "Generate Questions"

2. **Question Selection**
   - Review AI-generated questions
   - Click "Start Answering" on any question

3. **Voice Recording**
   - Click microphone button to start recording
   - Speak your answer clearly
   - View live transcript
   - Click stop when finished

4. **AI Feedback**
   - Review your score (1-10)
   - See missing keywords from JD
   - Read improvement suggestions
   - Study ideal answer example

## API Integration

The app is designed to work with these backend endpoints:

### `POST /parse-jd`
**Request:**
```json
{
  "jd": "Full job description text...",
  "role": "Role title"
}
```

**Response:**
```json
{
  "questions": [
    "Tell me about a time when...",
    "How do you handle...",
    "..."
  ]
}
```

### `POST /analyze-answer`
**Request:**
```json
{
  "transcript": "User's spoken answer...",
  "jd": "Original job description",
  "question": "The interview question",
  "role": "Role title"
}
```

**Response:**
```json
{
  "feedback": {
    "score": 7.5,
    "missingKeywords": ["agile", "scrum"],
    "improvements": [
      "Provide more specific examples",
      "Include metrics and outcomes"
    ],
    "idealAnswer": "Example of an ideal response..."
  }
}
```

## Browser Compatibility

- **Speech Recognition**: Chrome, Edge, Safari (desktop)
- **Modern browsers**: Chrome 90+, Firefox 88+, Safari 14+

## Development Notes

### Mock Data
The app includes mock responses for development without a backend:
- Sample questions generated from JD
- Mock feedback with realistic scoring
- Fallback handling for API errors

### Speech Recognition
- Uses Web Speech API for browser-native speech recognition
- Graceful fallback for unsupported browsers
- Continuous recording with interim results

### State Management
- Centralized state in App.jsx
- View-based navigation between components
- Proper cleanup of speech recognition resources

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details 