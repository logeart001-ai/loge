'use client'

import { useEffect, useRef } from 'react'

type RevealProps = {
  children: React.ReactNode
  /** Transition delay in ms. Supported: 0, 100, 200, 300, 400 */
  delay?: 0 | 100 | 200 | 300 | 400
  /** Root margin to trigger earlier/later */
  rootMargin?: string
}

export function Reveal({ children, delay = 0, rootMargin = '0px 0px -10% 0px' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      el.classList.add('visible')
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('visible')
            io.unobserve(el)
          }
        })
      },
      { threshold: 0.15, rootMargin }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])

  const delayClass = `reveal-delay-${delay}`

  return (
    <div ref={ref} className={`reveal ${delayClass}`}>
      {children}
    </div>
  )
}
