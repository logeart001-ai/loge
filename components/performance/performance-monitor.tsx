'use client'

import { useEffect } from 'react'

interface PerformanceMetrics {
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
}

export function PerformanceMonitor() {
  useEffect(() => {
    // Ensure we're in the browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || typeof performance === 'undefined') {
      return
    }
    
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    const observer = new PerformanceObserver((list) => {
      const metrics: Partial<PerformanceMetrics> = {}

      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              metrics.fcp = entry.startTime
            }
            break
          case 'largest-contentful-paint':
            metrics.lcp = entry.startTime
            break
          case 'first-input':
            metrics.fid = (entry as any).processingStart - entry.startTime
            break
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              metrics.cls = (metrics.cls || 0) + (entry as any).value
            }
            break
          case 'navigation':
            const navEntry = entry as PerformanceNavigationTiming
            metrics.ttfb = navEntry.responseStart - navEntry.requestStart
            break
        }
      }

      // Send metrics to analytics (replace with your analytics service)
      if (Object.keys(metrics).length > 0) {
        console.log('Performance Metrics:', metrics)
        
        // Example: Send to Google Analytics
        // gtag('event', 'web_vitals', {
        //   custom_map: { metric_name: 'custom_metric' },
        //   metric_name: 'LCP',
        //   value: Math.round(metrics.lcp || 0),
        //   event_category: 'Web Vitals'
        // })
      }
    })

    // Observe different performance entry types
    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] })
    } catch (error) {
      console.warn('Performance Observer not supported:', error)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  return null
}

// Hook for manual performance tracking
export function usePerformanceTracking() {
  const trackEvent = (eventName: string, duration?: number) => {
    if (typeof window === 'undefined') return

    const startTime = performance.now()
    
    return {
      end: () => {
        const endTime = performance.now()
        const actualDuration = duration || (endTime - startTime)
        
        console.log(`Performance: ${eventName} took ${actualDuration.toFixed(2)}ms`)
        
        // Send to analytics
        // gtag('event', 'timing_complete', {
        //   name: eventName,
        //   value: Math.round(actualDuration)
        // })
      }
    }
  }

  const trackPageLoad = (pageName: string) => {
    if (typeof window === 'undefined') return

    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
    console.log(`Page Load: ${pageName} loaded in ${loadTime}ms`)
    
    // Send to analytics
    // gtag('event', 'page_load_time', {
    //   page_title: pageName,
    //   value: loadTime
    // })
  }

  return { trackEvent, trackPageLoad }
}