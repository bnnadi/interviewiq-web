import { useState, useEffect, useCallback } from 'react'
import { 
  defaultAccessibilityConfig, 
  type AccessibilityConfig,
  prefersReducedMotion,
  prefersHighContrast,
  prefersDarkColorScheme,
  announceToScreenReader
} from '../utils/accessibilityUtils'

export interface UseAccessibilityReturn {
  config: AccessibilityConfig
  updateConfig: (updates: Partial<AccessibilityConfig>) => void
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  isReducedMotion: boolean
  isHighContrast: boolean
  isDarkMode: boolean
}

export const useAccessibility = (): UseAccessibilityReturn => {
  const [config, setConfig] = useState<AccessibilityConfig>(defaultAccessibilityConfig)
  const [isReducedMotion, setIsReducedMotion] = useState(false)
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Check user preferences on mount and when they change
  useEffect(() => {
    const checkPreferences = () => {
      setIsReducedMotion(prefersReducedMotion())
      setIsHighContrast(prefersHighContrast())
      setIsDarkMode(prefersDarkColorScheme())
    }

    checkPreferences()

    // Listen for preference changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-color-scheme: dark)')
    ]

    mediaQueries.forEach(mq => {
      mq.addEventListener('change', checkPreferences)
    })

    return () => {
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', checkPreferences)
      })
    }
  }, [])

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('accessibility-config')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.warn('Failed to parse saved accessibility config:', error)
      }
    }
  }, [])

  // Save preferences to localStorage
  const updateConfig = useCallback((updates: Partial<AccessibilityConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates }
      localStorage.setItem('accessibility-config', JSON.stringify(newConfig))
      return newConfig
    })
  }, [])

  // Announce changes to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (config.announceChanges) {
      announceToScreenReader(message, priority)
    }
  }, [config.announceChanges])

  return {
    config,
    updateConfig,
    announce,
    isReducedMotion,
    isHighContrast,
    isDarkMode
  }
}
