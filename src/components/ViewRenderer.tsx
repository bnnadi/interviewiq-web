import React from 'react'
import JobInput from './JobInput'
import QuestionList from './QuestionList'
import AnswerRecorder from './AnswerRecorder'
import FeedbackView from './FeedbackView'
import { VIEWS, type ViewType } from '../constants/appConstants'

interface ViewRendererProps {
  currentView: ViewType
  viewProps: Record<string, unknown>
}

const ViewRenderer = React.memo<ViewRendererProps>(function ViewRenderer({ 
  currentView, 
  viewProps 
}) {
  const viewComponents: Record<ViewType, React.ComponentType<any>> = {
    [VIEWS.JOB_INPUT]: JobInput,
    [VIEWS.QUESTION_LIST]: QuestionList,
    [VIEWS.ANSWER_RECORDER]: AnswerRecorder,
    [VIEWS.FEEDBACK]: FeedbackView
  }

  const ViewComponent = viewComponents[currentView]
  
  if (!ViewComponent) {
    console.warn(`Unknown view: ${currentView}`)
    return null
  }

  return <ViewComponent {...viewProps} />
})

export default ViewRenderer
