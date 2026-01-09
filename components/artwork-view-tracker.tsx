'use client'

import { useTrackView } from '@/hooks/use-track-view'

interface ArtworkViewTrackerProps {
  artworkId: string
}

/**
 * Component that tracks artwork views
 * Place this component on artwork detail pages
 */
export function ArtworkViewTracker({ artworkId }: ArtworkViewTrackerProps) {
  useTrackView(artworkId, true)
  
  // This component doesn't render anything
  return null
}
