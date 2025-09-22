import React from 'react'
import JobInput from './JobInput'
import QuestionList from './QuestionList'
import AnswerRecorder from './AnswerRecorder'
import FeedbackView from './FeedbackView'
import { VIEWS } from '../constants/appConstants.js'

const ViewRenderer = React.memo(function ViewRenderer({ 
  currentView, 
  viewProps 
}) {
  const viewComponents = {
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
