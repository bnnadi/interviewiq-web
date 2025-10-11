import React, { useState, useEffect, useCallback, useRef } from 'react'
import { keyboardNavigation } from '../utils/accessibilityUtils'

export interface UseKeyboardNavigationOptions {
  orientation?: 'horizontal' | 'vertical'
  loop?: boolean
  onNavigate?: (index: number) => void
  onActivate?: (index: number) => void
  onEscape?: () => void
}

export interface UseKeyboardNavigationReturn {
  containerRef: React.RefObject<HTMLElement>
  handleKeyDown: (event: React.KeyboardEvent) => void
  setCurrentIndex: (index: number) => void
  currentIndex: number
}

export const useKeyboardNavigation = (
  totalItems: number,
  options: UseKeyboardNavigationOptions = {}
): UseKeyboardNavigationReturn => {
  const {
    orientation = 'vertical',
    onNavigate,
    onActivate,
    onEscape
  } = options

  const containerRef = useRef<HTMLElement>(null)
  const currentIndexRef = useRef(0)

  const setCurrentIndex = useCallback((index: number) => {
    currentIndexRef.current = Math.max(0, Math.min(index, totalItems - 1))
  }, [totalItems])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    const { key } = event

    // Handle arrow key navigation
    if (key.startsWith('Arrow')) {
      const newIndex = keyboardNavigation.handleArrowKeys(
        event.nativeEvent,
        currentIndexRef.current,
        totalItems,
        orientation
      )

      if (newIndex !== null) {
        setCurrentIndex(newIndex)
        onNavigate?.(newIndex)
        
        // Focus the new item
        if (containerRef.current) {
          const items = containerRef.current.querySelectorAll('[data-navigation-item]')
          const targetItem = items[newIndex] as HTMLElement
          if (targetItem) {
            targetItem.focus()
          }
        }
      }
    }

    // Handle activation
    if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      onActivate?.(currentIndexRef.current)
    }

    // Handle escape
    if (key === 'Escape') {
      onEscape?.()
    }

    // Handle home/end keys
    if (key === 'Home') {
      event.preventDefault()
      setCurrentIndex(0)
      onNavigate?.(0)
    }

    if (key === 'End') {
      event.preventDefault()
      setCurrentIndex(totalItems - 1)
      onNavigate?.(totalItems - 1)
    }
  }, [totalItems, orientation, onNavigate, onActivate, onEscape, setCurrentIndex])

  // Set up keyboard event listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDownEvent = (event: KeyboardEvent) => {
      handleKeyDown(event as any)
    }

    container.addEventListener('keydown', handleKeyDownEvent)
    return () => container.removeEventListener('keydown', handleKeyDownEvent)
  }, [handleKeyDown])

  return {
    containerRef,
    handleKeyDown,
    setCurrentIndex,
    currentIndex: currentIndexRef.current
  }
}

/**
 * Hook for managing focus within a component
 */
export const useFocusManagement = () => {
  const focusableElementsRef = useRef<HTMLElement[]>([])

  const registerFocusableElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      focusableElementsRef.current.push(element)
    }
  }, [])

  const unregisterFocusableElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      focusableElementsRef.current = focusableElementsRef.current.filter(el => el !== element)
    }
  }, [])

  const focusNext = useCallback(() => {
    const elements = focusableElementsRef.current
    const currentIndex = elements.findIndex(el => el === document.activeElement)
    const nextIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0
    elements[nextIndex]?.focus()
  }, [])

  const focusPrevious = useCallback(() => {
    const elements = focusableElementsRef.current
    const currentIndex = elements.findIndex(el => el === document.activeElement)
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1
    elements[prevIndex]?.focus()
  }, [])

  const focusFirst = useCallback(() => {
    focusableElementsRef.current[0]?.focus()
  }, [])

  const focusLast = useCallback(() => {
    const elements = focusableElementsRef.current
    elements[elements.length - 1]?.focus()
  }, [])

  return {
    registerFocusableElement,
    unregisterFocusableElement,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast
  }
}

/**
 * Hook for managing ARIA live regions
 */
export const useAriaLiveRegion = () => {
  const [announcements, setAnnouncements] = useState<string[]>([])

  const announce = useCallback((message: string) => {
    setAnnouncements(prev => [...prev, message])
    
    // Clear announcement after a delay
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1))
    }, 1000)
  }, [])

  const LiveRegion = useCallback(() => (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcements[0]}
    </div>
  ), [announcements])

  return {
    announce,
    LiveRegion
  }
}
