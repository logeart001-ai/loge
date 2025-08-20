"use client"

import React, { useEffect, useRef } from "react"

type BackgroundVideoProps = {
  src: string
  className?: string
  poster?: string
  loop?: boolean
  muted?: boolean
  autoPlay?: boolean
  playsInline?: boolean
  preload?: "auto" | "metadata" | "none"
}

export function BackgroundVideo({
  src,
  className = "",
  poster,
  loop = true,
  muted = true,
  autoPlay = true,
  playsInline = true,
  preload = "auto",
}: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    // Ensure properties are set at runtime for stricter autoplay policies
    v.muted = muted
    v.loop = loop
    // Some browsers block autoplay unless play() is called after ensuring muted
    const tryPlay = async () => {
      try {
        await v.play()
      } catch {
        // As a fallback, attempt play after a short delay (e.g., hydration)
        setTimeout(() => {
          v.play().catch(() => {})
        }, 250)
      }
    }
    if (autoPlay) {
      tryPlay()
    }
  }, [autoPlay, loop, muted])

  return (
    <video
      ref={videoRef}
      className={className}
      poster={poster}
      loop={loop}
      muted={muted}
      autoPlay={autoPlay}
      playsInline={playsInline}
      preload={preload}
    >
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
}
