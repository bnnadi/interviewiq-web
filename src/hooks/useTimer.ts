import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTimerReturn {
  time: number
  formatTime: (seconds: number) => string
  reset: () => void
}

export const useTimer = (isActive: boolean): UseTimerReturn => {
  const [time, setTime] = useState<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive) {
      setTime(0)
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isActive])

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const reset = useCallback(() => {
    setTime(0)
  }, [])

  return { time, formatTime, reset }
}
