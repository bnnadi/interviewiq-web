import React from 'react'
import JobInput from '../components/JobInput'
import { useAppContext } from '../context/AppContext'

const JobInputPage: React.FC = () => {
  const { handleJobSubmit } = useAppContext()
  return <JobInput onSubmit={handleJobSubmit} />
}

export default JobInputPage
