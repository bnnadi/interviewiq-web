import React from 'react'
import { ViewType } from '../constants/appConstants'

// Import view components
import JobInput from './JobInput'
import QuestionList from './QuestionList'
import AnswerRecorder from './AnswerRecorder'
import FeedbackView from './FeedbackView'
import DashboardView from './DashboardView'

// Define the props interface with both currentView and viewProps
interface ViewRendererProps {
  currentView: ViewType
  viewProps: Record<string, any>
}

// View component mapping
const VIEW_COMPONENTS = {
  'job-input': JobInput,
  'question-list': QuestionList,
  'answer-recorder': AnswerRecorder,
  'feedback': FeedbackView,
  'dashboard': DashboardView
} as const

const ViewRenderer: React.FC<ViewRendererProps> = ({ currentView, viewProps = {} }) => {
  // Get the component for the current view
  const ViewComponent = VIEW_COMPONENTS[currentView]
  
  if (!ViewComponent) {
    console.error(`ViewRenderer: Unknown view type "${currentView}"`)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">View Not Found</h2>
          <p className="text-gray-600">The requested view "{currentView}" could not be found.</p>
        </div>
      </div>
    )
  }

  // Render the component with the provided props
  // Note: Some components may require specific props that should be provided via viewProps
  // Using type assertion since ViewRenderer is a generic component that can render any view
  return <ViewComponent {...(viewProps as any)} />
}

export default ViewRenderer
