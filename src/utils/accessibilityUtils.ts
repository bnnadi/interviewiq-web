/**
 * Accessibility utility functions for WCAG 2.1 AA compliance
 */

export interface AccessibilityConfig {
  announceChanges: boolean
  highContrast: boolean
  reducedMotion: boolean
  fontSize: 'small' | 'medium' | 'large'
}

export const defaultAccessibilityConfig: AccessibilityConfig = {
  announceChanges: true,
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium'
}

/**
 * Generate unique IDs for ARIA attributes
 */
export const generateAriaId = (prefix: string): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Check if user prefers high contrast
 */
export const prefersHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-contrast: high)').matches
}

/**
 * Check if user prefers dark color scheme
 */
export const prefersDarkColorScheme = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

// getContrastRatio function removed as it's not currently used

/**
 * Validate ARIA attributes
 */
export const validateAriaAttributes = (element: HTMLElement): string[] => {
  const errors: string[] = []
  
  // Check for required ARIA attributes
  if (element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
    // aria-label is present, which is good
  } else if (element.getAttribute('aria-labelledby')) {
    // aria-labelledby is present, check if referenced element exists
    const labelledBy = element.getAttribute('aria-labelledby')
    if (labelledBy && !document.getElementById(labelledBy)) {
      errors.push(`aria-labelledby references non-existent element: ${labelledBy}`)
    }
  } else if (element.getAttribute('role') && !element.textContent?.trim()) {
    // Element has a role but no accessible name
    errors.push(`Element with role "${element.getAttribute('role')}" needs an accessible name`)
  }
  
  return errors
}

/**
 * Create accessible button props
 */
export const createAccessibleButtonProps = (
  label: string,
  options: {
    disabled?: boolean
    pressed?: boolean
    expanded?: boolean
    controls?: string
    describedBy?: string
  } = {}
) => {
  const { disabled, pressed, expanded, controls, describedBy } = options
  
  return {
    'aria-label': label,
    'aria-disabled': disabled || undefined,
    'aria-pressed': pressed !== undefined ? pressed : undefined,
    'aria-expanded': expanded !== undefined ? expanded : undefined,
    'aria-controls': controls,
    'aria-describedby': describedBy,
    role: 'button',
    tabIndex: disabled ? -1 : 0
  }
}

/**
 * Create accessible form field props
 */
export const createAccessibleFormFieldProps = (
  label: string,
  options: {
    required?: boolean
    invalid?: boolean
    describedBy?: string
    errorMessage?: string
  } = {}
) => {
  const { required, invalid, describedBy, errorMessage } = options
  const fieldId = generateAriaId('field')
  const labelId = generateAriaId('label')
  const errorId = errorMessage ? generateAriaId('error') : undefined
  
  return {
    field: {
      id: fieldId,
      'aria-labelledby': labelId,
      'aria-required': required || undefined,
      'aria-invalid': invalid || undefined,
      'aria-describedby': [describedBy, errorId].filter(Boolean).join(' ') || undefined
    },
    label: {
      id: labelId,
      htmlFor: fieldId,
      children: label
    },
    error: errorId ? {
      id: errorId,
      role: 'alert',
      'aria-live': 'polite'
    } : undefined
  }
}

/**
 * Create accessible list props
 */
export const createAccessibleListProps = (
  options: {
    labelledBy?: string
    describedBy?: string
    orientation?: 'horizontal' | 'vertical'
  } = {}
) => {
  const { labelledBy, describedBy, orientation = 'vertical' } = options
  
  return {
    role: orientation === 'horizontal' ? 'list' : 'list',
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-orientation': orientation
  }
}

/**
 * Create accessible dialog props
 */
export const createAccessibleDialogProps = (
  options: {
    labelledBy?: string
    describedBy?: string
    modal?: boolean
  } = {}
) => {
  const { labelledBy, describedBy, modal = true } = options
  
  return {
    role: 'dialog',
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-modal': modal
  }
}

/**
 * Announce changes to screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  if (typeof window === 'undefined') return
  
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element
   */
  trapFocus: (element: HTMLElement): (() => void) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    // If no focusable elements, return empty cleanup function
    if (!firstElement || !lastElement) {
      return () => {}
    }
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
    
    element.addEventListener('keydown', handleTabKey)
    
    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleTabKey)
    }
  },
  
  /**
   * Focus first focusable element
   */
  focusFirst: (element: HTMLElement): void => {
    const focusableElement = element.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    
    if (focusableElement) {
      focusableElement.focus()
    }
  },
  
  /**
   * Focus last focusable element
   */
  focusLast: (element: HTMLElement): void => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
    
    const lastElement = focusableElements[focusableElements.length - 1]
    if (lastElement) {
      lastElement.focus()
    }
  }
}

/**
 * Keyboard navigation utilities
 */
export const keyboardNavigation = {
  /**
   * Handle arrow key navigation for lists
   */
  handleArrowKeys: (
    event: KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    orientation: 'horizontal' | 'vertical' = 'vertical'
  ): number | null => {
    const isVertical = orientation === 'vertical'
    
    switch (event.key) {
      case isVertical ? 'ArrowDown' : 'ArrowRight':
        event.preventDefault()
        return currentIndex < totalItems - 1 ? currentIndex + 1 : 0
      
      case isVertical ? 'ArrowUp' : 'ArrowLeft':
        event.preventDefault()
        return currentIndex > 0 ? currentIndex - 1 : totalItems - 1
      
      case 'Home':
        event.preventDefault()
        return 0
      
      case 'End':
        event.preventDefault()
        return totalItems - 1
      
      default:
        return null
    }
  },
  
  /**
   * Handle Enter and Space key activation
   */
  handleActivation: (event: KeyboardEvent, callback: () => void): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      callback()
    }
  }
}

/**
 * Screen reader utilities
 */
export const screenReader = {
  /**
   * Hide element from screen readers
   */
  hideFromScreenReader: (element: HTMLElement): void => {
    element.setAttribute('aria-hidden', 'true')
  },
  
  /**
   * Show element to screen readers
   */
  showToScreenReader: (element: HTMLElement): void => {
    element.removeAttribute('aria-hidden')
  },
  
  /**
   * Check if element is visible to screen readers
   */
  isVisibleToScreenReader: (element: HTMLElement): boolean => {
    return element.getAttribute('aria-hidden') !== 'true' && 
           !element.hasAttribute('hidden') &&
           element.offsetParent !== null
  }
}
