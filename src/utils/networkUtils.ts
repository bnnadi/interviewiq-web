/**
 * Network utilities for detecting connection status and handling offline scenarios
 */

export interface NetworkStatus {
  isOnline: boolean
  isSlowConnection: boolean
  connectionType?: string
}

export class NetworkManager {
  private static instance: NetworkManager
  private listeners: Set<(status: NetworkStatus) => void> = new Set()
  private currentStatus: NetworkStatus = {
    isOnline: navigator.onLine,
    isSlowConnection: false
  }

  private constructor() {
    this.setupEventListeners()
    this.detectConnectionSpeed()
  }

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager()
    }
    return NetworkManager.instance
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.updateStatus({ isOnline: true })
    })

    window.addEventListener('offline', () => {
      this.updateStatus({ isOnline: false })
    })

    // Listen for connection changes (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener('change', () => {
        this.detectConnectionSpeed()
      })
    }
  }

  private detectConnectionSpeed(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      const effectiveType = connection.effectiveType
      
      // Consider 3g and slower as slow connections
      this.updateStatus({
        isSlowConnection: effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g'
      })
    }
  }

  private updateStatus(updates: Partial<NetworkStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...updates }
    this.listeners.forEach(listener => listener(this.currentStatus))
  }

  getStatus(): NetworkStatus {
    return { ...this.currentStatus }
  }

  subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener)
    // Immediately call with current status
    listener(this.currentStatus)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  isOnline(): boolean {
    return this.currentStatus.isOnline
  }

  isSlowConnection(): boolean {
    return this.currentStatus.isSlowConnection
  }
}

// Export singleton instance
export const networkManager = NetworkManager.getInstance()

/**
 * Hook to monitor network status
 */
export const useNetworkStatus = () => {
  const [status, setStatus] = React.useState<NetworkStatus>(networkManager.getStatus())

  React.useEffect(() => {
    const unsubscribe = networkManager.subscribe(setStatus)
    return unsubscribe
  }, [])

  return status
}

// Import React for the hook
import React from 'react'
