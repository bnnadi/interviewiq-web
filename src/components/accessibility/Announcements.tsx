import React, { useEffect } from 'react'
import { useAriaLiveRegion } from '../../hooks/useKeyboardNavigation'

interface AnnouncementsProps {
  message?: string
  className?: string
}

const Announcements: React.FC<AnnouncementsProps> = ({ 
  message, 
  className = ''
}) => {
  const { announce, LiveRegion } = useAriaLiveRegion()

  useEffect(() => {
    if (message) {
      announce(message)
    }
  }, [message, announce])

  return (
    <div className={`announcements ${className}`}>
      <LiveRegion />
    </div>
  )
}

export default Announcements
