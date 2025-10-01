'use client'

import { useEffect } from 'react'

interface PreloadResourcesProps {
  images?: string[]
  fonts?: string[]
  scripts?: string[]
}

export function PreloadResources({ images = [], fonts = [], scripts = [] }: PreloadResourcesProps) {
  useEffect(() => {
    // Preload critical images
    images.forEach(src => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)
    })

    // Preload fonts
    fonts.forEach(href => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'font'
      link.type = 'font/woff2'
      link.crossOrigin = 'anonymous'
      link.href = href
      document.head.appendChild(link)
    })

    // Preload scripts
    scripts.forEach(src => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'script'
      link.href = src
      document.head.appendChild(link)
    })
  }, [images, fonts, scripts])

  return null
}