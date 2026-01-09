'use client'

import { useEffect, useRef } from 'react'

/**
 * Hook to track artwork views
 * Automatically tracks when component mounts and user stays for 3+ seconds
 */
export function useTrackView(artworkId: string | undefined, enabled: boolean = true) {
  const tracked = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!artworkId || !enabled || tracked.current) {
      return
    }

    // Track view after user stays on page for 3 seconds (indicates genuine interest)
    timeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/artworks/${artworkId}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        tracked.current = true
      } catch (error) {
        console.error('Failed to track view:', error)
      }
    }, 3000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [artworkId, enabled])
}
