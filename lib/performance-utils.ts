// Performance utility functions

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function to limit function calls to once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Lazy load a component with dynamic import
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFunc)
  
  const LazyWrapper = (props: React.ComponentProps<T>) => {
    const fallbackElement = fallback ? React.createElement(fallback) : React.createElement('div', {}, 'Loading...')
    return React.createElement(React.Suspense, { fallback: fallbackElement }, React.createElement(LazyComponent, props))
  }
  
  LazyWrapper.displayName = 'LazyWrapper'
  return LazyWrapper
}

/**
 * Preload a route for faster navigation
 */
export function preloadRoute(href: string) {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = href
  document.head.appendChild(link)
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get connection speed information
 */
export function getConnectionSpeed(): 'slow' | 'fast' | 'unknown' {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return 'unknown'
  }

  const connection = (navigator as any).connection
  
  if (connection.effectiveType === '4g' && connection.downlink > 1.5) {
    return 'fast'
  } else if (connection.effectiveType === '3g' || connection.downlink < 1.5) {
    return 'slow'
  }
  
  return 'unknown'
}

/**
 * Optimize images based on connection speed
 */
export function getOptimalImageQuality(): number {
  const speed = getConnectionSpeed()
  
  switch (speed) {
    case 'slow':
      return 60 // Lower quality for slow connections
    case 'fast':
      return 85 // Higher quality for fast connections
    default:
      return 75 // Default quality
  }
}

/**
 * Check if device has limited resources
 */
export function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  
  // Check for device memory (Chrome only)
  const deviceMemory = (navigator as any).deviceMemory
  if (deviceMemory && deviceMemory < 4) {
    return true
  }
  
  // Check for hardware concurrency (number of CPU cores)
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return true
  }
  
  return false
}

/**
 * Adaptive loading based on device capabilities
 */
export function shouldLoadHeavyContent(): boolean {
  if (isLowEndDevice()) return false
  if (getConnectionSpeed() === 'slow') return false
  return true
}

/**
 * Measure and log performance
 */
export function measurePerformance(name: string, fn: () => void | Promise<void>) {
  const start = performance.now()
  
  const result = fn()
  
  if (result instanceof Promise) {
    return result.then(() => {
      const end = performance.now()
      console.log(`Performance: ${name} took ${(end - start).toFixed(2)}ms`)
    })
  } else {
    const end = performance.now()
    console.log(`Performance: ${name} took ${(end - start).toFixed(2)}ms`)
  }
}

/**
 * Create a performance observer for specific metrics
 */
export function observePerformance(
  entryTypes: string[],
  callback: (entries: PerformanceEntry[]) => void
) {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return () => {}
  }

  const observer = new PerformanceObserver((list) => {
    callback(list.getEntries())
  })

  try {
    observer.observe({ entryTypes })
  } catch (error) {
    console.warn('Performance Observer not supported for:', entryTypes)
  }

  return () => observer.disconnect()
}

// React import for lazy loading
import React from 'react'