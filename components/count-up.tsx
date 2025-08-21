'use client'

import { useEffect, useRef, useState } from 'react'

type CountUpProps = {
  start?: number
  end: number
  duration?: number // ms
  prefix?: string
  suffix?: string
  className?: string
}

export function CountUp({ start = 0, end, duration = 1200, prefix = '', suffix = '', className }: CountUpProps) {
  const [value, setValue] = useState(start)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const animate = () => {
      if (prefersReduced) {
        setValue(end)
        return
      }
      const startTime = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration)
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3)
        const current = Math.round(start + (end - start) * eased)
        setValue(current)
        if (t < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true
            animate()
            io.unobserve(el)
          }
        })
      },
      { threshold: 0.3, rootMargin: '0px 0px -10% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [end, start, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  )
}
