import { createServerClient } from '@/lib/supabase'
import { createClient } from '@/lib/supabase-client'
import { withCache } from '@/lib/cache'

// Server-side queries with proper error handling
export async function getArtworkById(id: string) {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('artworks')
      .select(`*`)
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
  return withCache(
    `featured-artworks-${limit}`,
    async () => {
      try {
        const supabase = await createServerClient()
        
        // Primary query expecting is_available & is_featured columns
        const primary = await supabase
          .from('artworks')
          .select(`
            *
          `)
          .eq('is_available', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (primary.error) {
          const rawErr = primary.error as unknown
          const msg = (typeof rawErr === 'object' && rawErr && 'message' in rawErr)
            ? (rawErr as { message?: string }).message || ''
            : String(rawErr)
          const missingAvailable = /column .*is_available.* does not exist/i.test(msg)
          const missingFeatured = /column .*is_featured.* does not exist/i.test(msg)
          if (missingAvailable || missingFeatured) {
            console.warn('[getFeaturedArtworks] Missing columns:', { missingAvailable, missingFeatured, msg })
            // Fallback: drop the missing filters progressively
            let fallbackQuery = supabase
              .from('artworks')
              .select(`*`)
              .order('created_at', { ascending: false })
              .limit(limit)
            // If is_featured exists but is_available missing, still filter by is_featured
            if (!missingFeatured) fallbackQuery = fallbackQuery.eq('is_featured', true)
            const fallback = await fallbackQuery
            if (fallback.error) {
              console.error('Fallback featured artworks query failed:', JSON.stringify(fallback.error, null, 2))
              return []
            }
            return fallback.data || []
          }
          console.error('Error fetching featured artworks:', JSON.stringify(primary.error, null, 2))
          return []
        }
        
        // If query succeeded but returned no rows, attempt a softer fallback (maybe filters too strict)
        if ((primary.data?.length || 0) === 0) {
          const soft = await supabase
            .from('artworks')
            .select(`*`)
            .order('created_at', { ascending: false })
            .limit(limit)
          if (soft.error) {
            console.error('Soft fallback featured artworks query failed:', JSON.stringify(soft.error, null, 2))
            return []
          }
          return soft.data || []
        }
        
        return primary.data || []
      } catch (error) {
        console.error('Unexpected error fetching featured artworks:', JSON.stringify(error, null, 2))
        return []
      }
    },
    300 // 5 minutes cache
  )
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
      .select(`*`)
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

    // Attempt query with is_featured filter
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`*`)
      .eq('role', 'creator')
      .eq('is_featured', true)
      .order('rating', { ascending: false })
      .limit(limit)

    if (error) {
      // Potential causes: column does not exist, RLS restriction, or other failure
      const rawErr: unknown = error
      const msg = (typeof rawErr === 'object' && rawErr && 'message' in rawErr)
        ? (rawErr as { message?: string }).message || ''
        : String(rawErr)
      const isMissingCol = /column .*is_featured.* does not exist/i.test(msg)
      if (isMissingCol) {
        console.warn('[getFeaturedCreators] is_featured column missing; falling back to role-only filter.')
        const fallback = await supabase
          .from('user_profiles')
          .select(`*`)
          .eq('role', 'creator')
          .order('rating', { ascending: false })
          .limit(limit)
        if (fallback.error) {
          console.error('Fallback featured creators query failed:', JSON.stringify(fallback.error, null, 2))
          return []
        }
        return fallback.data || []
      }
      console.error('Error fetching featured creators:', JSON.stringify(error, null, 2))
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching featured creators:', JSON.stringify(error, null, 2))
    return []
  }
}

export async function getUpcomingEvents(limit: number = 6) {
  try {
    const supabase = await createServerClient()

    // NOTE: Current schema (see 06-check-and-create-missing.sql) uses event_date (not start_date) 
    // and does not define is_published, is_free, ticket_price. We adapt gracefully here.
    const nowIso = new Date().toISOString()
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', nowIso)
      .order('event_date', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching upcoming events:', error?.message || error, error)
      return []
    }

    // Backward compatibility mapping so UI that expects start_date, is_free, ticket_price still works
    type RawEvent = {
      id: string
      title: string
      description?: string | null
      event_type: string
      event_date: string
      location?: string | null
      image_url?: string | null
      registration_url?: string | null
      is_featured?: boolean | null
      created_at?: string
      updated_at?: string
      // Potential legacy / extended fields
      start_date?: string
      is_free?: boolean
      ticket_price?: number | null
      is_published?: boolean
    }

    const adapted = (data as RawEvent[] | null | undefined)?.map(evt => ({
      ...evt,
      start_date: evt.start_date ?? evt.event_date,
      is_free: typeof evt.is_free === 'boolean' ? evt.is_free : true,
      ticket_price: typeof evt.ticket_price === 'number' ? evt.ticket_price : null,
      is_published: typeof evt.is_published === 'boolean' ? evt.is_published : true
    })) || []

    return adapted
  } catch (error) {
    const err = error as Error
    console.error('Unexpected error fetching upcoming events:', err.message, err)
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

// ===============================
// Cart Helper Functions (Client)
// ===============================
// Assumed schema (adjust if actual differs):
// carts: { id uuid PK, user_id uuid FK, status text, created_at timestamptz, updated_at timestamptz }
// cart_items: { id uuid PK, cart_id uuid FK, artwork_id uuid FK, quantity int, unit_price numeric, created_at timestamptz, updated_at timestamptz }
// artworks: { id uuid PK, price numeric, title text, thumbnail_url text, ... }

type CartItemRow = {
  id: string
  cart_id: string
  artwork_id: string
  quantity: number
  unit_price: number | null
  created_at?: string
  updated_at?: string
  artwork?: {
    id: string
    title: string
    price: number | null
    thumbnail_url: string | null
    category?: string | null
  } | null
}

export type ActiveCart = {
  id: string
  status: string
  items: CartItemRow[]
  subtotal: number
  total: number
  itemCount: number
  created_at?: string
  updated_at?: string
}

function computeCartTotals(items: CartItemRow[]): { subtotal: number; total: number; itemCount: number } {
  const subtotal = items.reduce((sum, it) => sum + (Number(it.unit_price ?? it.artwork?.price ?? 0) * it.quantity), 0)
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0)
  // For now no tax / shipping logic
  return { subtotal, total: subtotal, itemCount }
}

async function getOrCreateActiveCartInternal(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Try fetch existing active cart
  const { data: existingCart, error: cartErr } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (cartErr) {
    console.error('Error fetching active cart:', cartErr)
    throw cartErr
  }

  if (existingCart) return existingCart

  const { data: newCart, error: createErr } = await supabase
    .from('carts')
    .insert({ user_id: user.id, status: 'active' })
    .select('*')
    .single()

  if (createErr) {
    console.error('Error creating cart:', createErr)
    throw createErr
  }

  return newCart
}

async function fetchCartWithItems(supabase: ReturnType<typeof createClient>, cartId: string): Promise<ActiveCart> {
  const { data: items, error: itemsErr } = await supabase
    .from('cart_items')
    .select(`
      *,
      artwork:artworks!artwork_id (
        id,
        title,
        price,
        thumbnail_url,
        category
      )
    `)
    .eq('cart_id', cartId)
    .order('created_at', { ascending: true })

  if (itemsErr) {
    console.error('Error fetching cart items:', itemsErr)
    throw itemsErr
  }

  const safeItems: CartItemRow[] = items || []
  const { subtotal, total, itemCount } = computeCartTotals(safeItems)

  return {
    id: cartId,
    status: 'active',
    items: safeItems,
    subtotal,
    total,
    itemCount
  }
}

export async function getActiveCart(): Promise<ActiveCart | null> {
  try {
    const supabase = createClient()
    const cart = await getOrCreateActiveCartInternal(supabase)
    if (!cart) return null
    return await fetchCartWithItems(supabase, cart.id)
  } catch (error) {
    console.error('Unexpected error getting active cart:', error)
    return null
  }
}

export async function addItemToCart(artworkId: string, quantity: number = 1): Promise<ActiveCart | null> {
  try {
    if (quantity <= 0) throw new Error('Quantity must be positive')
    const supabase = createClient()
    const cart = await getOrCreateActiveCartInternal(supabase)
    if (!cart) throw new Error('Not authenticated')

    // Check if item already exists
    const { data: existingItem, error: existingErr } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('artwork_id', artworkId)
      .maybeSingle()

    if (existingErr) {
      console.error('Error checking existing cart item:', existingErr)
      throw existingErr
    }

    if (existingItem) {
      const { error: updateErr } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)

      if (updateErr) {
        console.error('Error updating cart item quantity:', updateErr)
        throw updateErr
      }
    } else {
      // Need artwork price
      const { data: artwork, error: artErr } = await supabase
        .from('artworks')
        .select('id, price')
        .eq('id', artworkId)
        .single()
      if (artErr) {
        console.error('Error fetching artwork price:', artErr)
        throw artErr
      }

      const { error: insertErr } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
            artwork_id: artworkId,
            quantity,
            unit_price: artwork?.price ?? null
        })

      if (insertErr) {
        console.error('Error inserting cart item:', insertErr)
        throw insertErr
      }
    }

    return await fetchCartWithItems(supabase, cart.id)
  } catch (error) {
    console.error('Unexpected error adding item to cart:', error)
    throw error
  }
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<ActiveCart | null> {
  try {
    const supabase = createClient()
    const cart = await getOrCreateActiveCartInternal(supabase)
    if (!cart) throw new Error('Not authenticated')

    if (quantity <= 0) {
      const { error: delErr } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)
        .eq('cart_id', cart.id)
      if (delErr) {
        console.error('Error deleting cart item (quantity <=0):', delErr)
        throw delErr
      }
    } else {
      const { error: updErr } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', cartItemId)
        .eq('cart_id', cart.id)
      if (updErr) {
        console.error('Error updating cart item quantity:', updErr)
        throw updErr
      }
    }

    return await fetchCartWithItems(supabase, cart.id)
  } catch (error) {
    console.error('Unexpected error updating cart item quantity:', error)
    throw error
  }
}

export async function removeCartItem(cartItemId: string): Promise<ActiveCart | null> {
  try {
    const supabase = createClient()
    const cart = await getOrCreateActiveCartInternal(supabase)
    if (!cart) throw new Error('Not authenticated')

    const { error: delErr } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .eq('cart_id', cart.id)

    if (delErr) {
      console.error('Error removing cart item:', delErr)
      throw delErr
    }

    return await fetchCartWithItems(supabase, cart.id)
  } catch (error) {
    console.error('Unexpected error removing cart item:', error)
    throw error
  }
}

export async function clearCart(): Promise<ActiveCart | null> {
  try {
    const supabase = createClient()
    const cart = await getOrCreateActiveCartInternal(supabase)
    if (!cart) throw new Error('Not authenticated')
    const { error: delErr } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)

    if (delErr) {
      console.error('Error clearing cart:', delErr)
      throw delErr
    }

    return await fetchCartWithItems(supabase, cart.id)
  } catch (error) {
    console.error('Unexpected error clearing cart:', error)
    throw error
  }
}

