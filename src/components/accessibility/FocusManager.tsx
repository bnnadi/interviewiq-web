import React, { useEffect, useRef, ReactNode } from 'react'
import { focusManagement } from '../../utils/accessibilityUtils'

interface FocusManagerProps {
  children: ReactNode
  trapFocus?: boolean
  restoreFocus?: boolean
  initialFocus?: boolean
  className?: string
}

const FocusManager: React.FC<FocusManagerProps> = ({
  children,
  trapFocus = false,
  restoreFocus = false,
  initialFocus = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Store the previously focused element
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement
    }

    // Focus the first focusable element if requested
    if (initialFocus && containerRef.current) {
      focusManagement.focusFirst(containerRef.current)
    }

    // Set up focus trap if requested
    let cleanup: (() => void) | undefined
    if (trapFocus && containerRef.current) {
      cleanup = focusManagement.trapFocus(containerRef.current)
    }

    return () => {
      // Restore focus to previous element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
      
      // Clean up focus trap
      if (cleanup) {
        cleanup()
      }
    }
  }, [trapFocus, restoreFocus, initialFocus])

  return (
    <div
      ref={containerRef}
      className={`focus-manager ${className}`}
      role={trapFocus ? 'dialog' : undefined}
      aria-modal={trapFocus ? 'true' : undefined}
    >
      {children}
    </div>
  )
}

export default FocusManager
