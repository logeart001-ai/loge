'use client'

import { useEffect } from 'react'

// Critical CSS for above-the-fold content
const criticalCSS = `
  /* Critical styles for immediate rendering */
  .hero-section {
    min-height: 100vh;
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  }
  
  .navbar {
    height: 64px;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .loading-skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
  }
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  /* Prevent layout shift */
  .image-container {
    position: relative;
    overflow: hidden;
  }
  
  .image-container::before {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    background: #f3f4f6;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }
`

export function CriticalCSS() {
  useEffect(() => {
    // Inject critical CSS immediately
    const style = document.createElement('style')
    style.textContent = criticalCSS
    document.head.appendChild(style)

    // Remove after main CSS loads
    const timer = setTimeout(() => {
      document.head.removeChild(style)
    }, 3000)

    return () => {
      clearTimeout(timer)
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])

  return null
}