'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'

interface ArtworkViewTrackerProps {
  artworkId: string
}

export function ArtworkViewTracker({ artworkId }: ArtworkViewTrackerProps) {
  const supabase = createClient()

  useEffect(() => {
    const trackView = async () => {
      try {
        // Get user info (optional - can track anonymous views too)
        const { data: { user } } = await supabase.auth.getUser()
        
        // Get user's IP and user agent for tracking
        const userAgent = navigator.userAgent
        
        // Insert view record
        await supabase
          .from('artwork_views')
          .insert({
            artwork_id: artworkId,
            user_id: user?.id || null,
            user_agent: userAgent,
            // Note: IP address would need to be set server-side for security
          })

      } catch (error) {
        // Silently fail - view tracking shouldn't break the user experience
        console.debug('View tracking failed:', error)
      }
    }

    // Track view after a short delay to ensure it's a meaningful view
    const timer = setTimeout(trackView, 2000)

    return () => clearTimeout(timer)
  }, [artworkId, supabase])

  // This component doesn't render anything
  return null
}