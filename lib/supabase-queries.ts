import { createServerClient } from '@/lib/supabase'
import { createClient } from '@/lib/supabase-client'

// Server-side queries with proper error handling
export async function getArtworkById(id: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('artworks')
      .select(`
        *,
        creator:user_profiles!creator_id (
          id,
          full_name,
          avatar_url,
          location,
          bio,
          rating
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching artwork by id:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error fetching artwork by id:', error)
    return null
  }
}

export async function getFeaturedArtworks(limit: number = 12) {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('artworks')
      .select(`
        *,
        creator:user_profiles!creator_id (
          id,
          full_name,
          avatar_url,
          location,
          rating
        )
      `)
      .eq('is_available', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching featured artworks:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Unexpected error fetching featured artworks:', error)
    return []
  }
}

export async function getArtworksByCategory(
  category: string,
  limit: number = 20,
  offset: number = 0
) {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('artworks')
      .select(`
        *,
        creator:user_profiles!creator_id (
          id,
          full_name,
          avatar_url,
          location,
          rating
        )
      `)
      .eq('is_available', true)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching artworks by category:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Unexpected error fetching artworks by category:', error)
    return []
  }
}

export async function getFeaturedCreators(limit: number = 6) {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        artworks:artworks!creator_id (
          id,
          thumbnail_url,
          title,
          price
        )
      `)
      .eq('role', 'creator')
      .eq('is_featured', true)
      .order('rating', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching featured creators:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Unexpected error fetching featured creators:', error)
    return []
  }
}

export async function getUpcomingEvents(limit: number = 6) {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_published', true)
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching upcoming events:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Unexpected error fetching upcoming events:', error)
    return []
  }
}

export async function getBlogPosts(limit: number = 6) {
  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:user_profiles!author_id (
          full_name,
          avatar_url
        )
      `)
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching blog posts:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Unexpected error fetching blog posts:', error)
    return []
  }
}

// Client-side queries with proper error handling
export async function searchArtworks(
  query: string,
  filters: {
    category?: string
    minPrice?: number
    maxPrice?: number
    creatorId?: string
  } = {},
  limit: number = 20,
  offset: number = 0
) {
  try {
    const supabase = createClient()
    
    let queryBuilder = supabase
      .from('artworks')
      .select(`
        *,
        creator:user_profiles!creator_id (
          id,
          full_name,
          avatar_url,
          location,
          rating
        )
      `)
      .eq('is_available', true)

    if (query) {
      queryBuilder = queryBuilder.textSearch('title,description', query)
    }

    if (filters.category) {
      queryBuilder = queryBuilder.eq('category', filters.category)
    }

    if (filters.minPrice) {
      queryBuilder = queryBuilder.gte('price', filters.minPrice)
    }

    if (filters.maxPrice) {
      queryBuilder = queryBuilder.lte('price', filters.maxPrice)
    }

    if (filters.creatorId) {
      queryBuilder = queryBuilder.eq('creator_id', filters.creatorId)
    }

    const { data, error } = await queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error searching artworks:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Unexpected error searching artworks:', error)
    return []
  }
}

export async function getCreatorProfile(creatorId: string) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        artworks:artworks!creator_id (
          id,
          title,
          thumbnail_url,
          price,
          category,
          created_at
        ),
        followers:follows!following_id (
          follower_id
        ),
        reviews:reviews!creator_id (
          id,
          rating,
          comment,
          reviewer:user_profiles!reviewer_id (
            full_name,
            avatar_url
          )
        )
      `)
      .eq('id', creatorId)
      .single()

    if (error) {
      console.error('Error fetching creator profile:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Unexpected error fetching creator profile:', error)
    return null
  }
}

export async function addToWishlist(artworkId: string) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('wishlists')
      .insert({ user_id: user.id, artwork_id: artworkId })

    if (error) {
      console.error('Error adding to wishlist:', error)
      throw error
    }
  } catch (error) {
    console.error('Unexpected error adding to wishlist:', error)
    throw error
  }
}

export async function removeFromWishlist(artworkId: string) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('artwork_id', artworkId)

    if (error) {
      console.error('Error removing from wishlist:', error)
      throw error
    }
  } catch (error) {
    console.error('Unexpected error removing from wishlist:', error)
    throw error
  }
}

export async function followCreator(creatorId: string) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: creatorId })

    if (error) {
      console.error('Error following creator:', error)
      throw error
    }
  } catch (error) {
    console.error('Unexpected error following creator:', error)
    throw error
  }
}

export async function unfollowCreator(creatorId: string) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', creatorId)

    if (error) {
      console.error('Error unfollowing creator:', error)
      throw error
    }
  } catch (error) {
    console.error('Unexpected error unfollowing creator:', error)
    throw error
  }
}
