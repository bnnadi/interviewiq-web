import React from 'react'
import JobInput from '../components/JobInput'
import { useAppContext } from '../context/AppContext'

const JobInputPage: React.FC = () => {
  const { handleJobSubmit } = useAppContext()
  return <JobInput onSubmit={(data) => handleJobSubmit(data.jobDescription, data.role, data.company)} />
}

export default JobInputPage
