import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: wishlistItems, error } = await supabase
      .from('wishlists')
      .select(`
        id,
        created_at,
        artwork_id,
        artworks (
          id,
          title,
          price,
          currency,
          image_urls,
          thumbnail_url,
          is_available,
          user_profiles (
            full_name
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching wishlist:', error)
      return NextResponse.json(
        { error: 'Failed to fetch wishlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: wishlistItems || [],
      count: wishlistItems?.length || 0
    })

  } catch (error) {
    console.error('Wishlist GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/wishlist - Add item to wishlist
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { artwork_id } = body

    if (!artwork_id) {
      return NextResponse.json(
        { error: 'Artwork ID is required' },
        { status: 400 }
      )
    }

    // Check if artwork exists
    const { data: artwork, error: artworkError } = await supabase
      .from('artworks')
      .select('id, title')
      .eq('id', artwork_id)
      .single()

    if (artworkError || !artwork) {
      return NextResponse.json(
        { error: 'Artwork not found' },
        { status: 404 }
      )
    }

    // Add to wishlist (will fail if already exists due to unique constraint)
    const { data: wishlistItem, error } = await supabase
      .from('wishlists')
      .insert({
        user_id: user.id,
        artwork_id: artwork_id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Item already in wishlist' },
          { status: 409 }
        )
      }
      console.error('Error adding to wishlist:', error)
      return NextResponse.json(
        { error: 'Failed to add to wishlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Added to wishlist',
      data: wishlistItem
    })

  } catch (error) {
    console.error('Wishlist POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/wishlist - Remove item from wishlist
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { artwork_id } = body

    if (!artwork_id) {
      return NextResponse.json(
        { error: 'Artwork ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', user.id)
      .eq('artwork_id', artwork_id)

    if (error) {
      console.error('Error removing from wishlist:', error)
      return NextResponse.json(
        { error: 'Failed to remove from wishlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from wishlist'
    })

  } catch (error) {
    console.error('Wishlist DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}