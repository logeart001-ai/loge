import { createServerClient } from './supabase'

export interface ViewStats {
  total_views: number
  unique_users: number
  days_with_views: number
  last_viewed_at: string | null
  views_today: number
  views_this_week: number
  views_this_month: number
}

export interface ArtworkViewStats extends ViewStats {
  artwork_id: string
}

/**
 * Get view statistics for a specific artwork
 */
export async function getArtworkViewStats(artworkId: string): Promise<ViewStats | null> {
  try {
    const supabase = await createServerClient()

    // Get aggregated stats from the view
    const { data: aggregated } = await supabase
      .from('artwork_view_counts')
      .select('*')
      .eq('artwork_id', artworkId)
      .single()

    if (!aggregated) {
      return {
        total_views: 0,
        unique_users: 0,
        days_with_views: 0,
        last_viewed_at: null,
        views_today: 0,
        views_this_week: 0,
        views_this_month: 0,
      }
    }

    // Get time-based stats
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [todayResult, weekResult, monthResult] = await Promise.all([
      supabase
        .from('artwork_views')
        .select('id', { count: 'exact', head: true })
        .eq('artwork_id', artworkId)
        .gte('viewed_at', today),
      supabase
        .from('artwork_views')
        .select('id', { count: 'exact', head: true })
        .eq('artwork_id', artworkId)
        .gte('viewed_at', weekAgo),
      supabase
        .from('artwork_views')
        .select('id', { count: 'exact', head: true })
        .eq('artwork_id', artworkId)
        .gte('viewed_at', monthAgo),
    ])

    return {
      total_views: aggregated.total_views || 0,
      unique_users: aggregated.unique_users || 0,
      days_with_views: aggregated.days_with_views || 0,
      last_viewed_at: aggregated.last_viewed_at,
      views_today: todayResult.count || 0,
      views_this_week: weekResult.count || 0,
      views_this_month: monthResult.count || 0,
    }
  } catch (error) {
    console.error('Error fetching view stats:', error)
    return null
  }
}

/**
 * Get view statistics for all artworks by a creator
 */
export async function getCreatorViewStats(creatorId: string): Promise<{
  total_views: number
  total_artworks: number
  artworks: ArtworkViewStats[]
}> {
  try {
    const supabase = await createServerClient()

    // Get all artworks by creator
    const { data: artworks } = await supabase
      .from('artworks')
      .select('id, title')
      .eq('creator_id', creatorId)

    if (!artworks || artworks.length === 0) {
      return {
        total_views: 0,
        total_artworks: 0,
        artworks: [],
      }
    }

    const artworkIds = artworks.map(a => a.id)

    // Get view counts for all artworks
    const { data: viewCounts } = await supabase
      .from('artwork_view_counts')
      .select('*')
      .in('artwork_id', artworkIds)

    // Calculate totals
    const total_views = viewCounts?.reduce((sum, vc) => sum + (vc.total_views || 0), 0) || 0

    // Get time-based stats for each artwork
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const artworkStats: ArtworkViewStats[] = await Promise.all(
      artworks.map(async (artwork) => {
        const viewCount = viewCounts?.find(vc => vc.artwork_id === artwork.id)

        const [todayResult, weekResult, monthResult] = await Promise.all([
          supabase
            .from('artwork_views')
            .select('id', { count: 'exact', head: true })
            .eq('artwork_id', artwork.id)
            .gte('viewed_at', today),
          supabase
            .from('artwork_views')
            .select('id', { count: 'exact', head: true })
            .eq('artwork_id', artwork.id)
            .gte('viewed_at', weekAgo),
          supabase
            .from('artwork_views')
            .select('id', { count: 'exact', head: true })
            .eq('artwork_id', artwork.id)
            .gte('viewed_at', monthAgo),
        ])

        return {
          artwork_id: artwork.id,
          total_views: viewCount?.total_views || 0,
          unique_users: viewCount?.unique_users || 0,
          days_with_views: viewCount?.days_with_views || 0,
          last_viewed_at: viewCount?.last_viewed_at || null,
          views_today: todayResult.count || 0,
          views_this_week: weekResult.count || 0,
          views_this_month: monthResult.count || 0,
        }
      })
    )

    return {
      total_views,
      total_artworks: artworks.length,
      artworks: artworkStats,
    }
  } catch (error) {
    console.error('Error fetching creator view stats:', error)
    return {
      total_views: 0,
      total_artworks: 0,
      artworks: [],
    }
  }
}

/**
 * Get trending artworks based on recent views
 */
export async function getTrendingArtworks(limit: number = 10) {
  try {
    const supabase = await createServerClient()

    // Get artworks with most views in the last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: trendingViews } = await supabase
      .from('artwork_views')
      .select('artwork_id')
      .gte('viewed_at', weekAgo)

    if (!trendingViews || trendingViews.length === 0) {
      return []
    }

    // Count views per artwork
    const viewCounts = trendingViews.reduce((acc, view) => {
      acc[view.artwork_id] = (acc[view.artwork_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Sort by view count and get top artworks
    const topArtworkIds = Object.entries(viewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id]) => id)

    // Fetch artwork details
    const { data: artworks } = await supabase
      .from('artworks')
      .select(`
        id,
        title,
        price,
        thumbnail_url,
        category,
        user_profiles!creator_id (
          full_name,
          username,
          avatar_url
        )
      `)
      .in('id', topArtworkIds)
      .eq('is_available', true)
      .eq('approval_status', 'approved')

    return artworks || []
  } catch (error) {
    console.error('Error fetching trending artworks:', error)
    return []
  }
}
