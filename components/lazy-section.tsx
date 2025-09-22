'use client'

import { ReactNode, useEffect, useState, useRef } from 'react'

interface LazySectionProps {
  children: ReactNode
  fallback?: ReactNode
  threshold?: number
  rootMargin?: string
  className?: string
}

export function LazySection({ 
  children, 
  fallback = <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />, 
  threshold = 0.1,
  rootMargin = '100px',
  className = ''
}: LazySectionProps) {
  const [shouldRender, setShouldRender] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          setShouldRender(true)
          observer.disconnect()
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return (
    <div ref={ref} className={className}>
      {shouldRender ? children : fallback}
    </div>
  )
}