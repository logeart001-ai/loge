import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// GET /api/follow - Get user's following list
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

    const { data: following, error } = await supabase
      .from('follows')
      .select(`
        id,
        created_at,
        following_id,
        following:following_id (
          id,
          full_name,
          avatar_url,
          bio,
          discipline,
          location,
          is_verified
        )
      `)
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching following list:', error)
      return NextResponse.json(
        { error: 'Failed to fetch following list' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: following || [],
      count: following?.length || 0
    })

  } catch (error) {
    console.error('Follow GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/follow - Follow a creator
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
    const { creator_id } = body

    if (!creator_id) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      )
    }

    if (creator_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Check if creator exists
    const { data: creator, error: creatorError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role')
      .eq('id', creator_id)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    if (creator.role !== 'creator') {
      return NextResponse.json(
        { error: 'Can only follow creators' },
        { status: 400 }
      )
    }

    // Follow the creator
    const { data: followRecord, error } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: creator_id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Already following this creator' },
          { status: 409 }
        )
      }
      console.error('Error following creator:', error)
      return NextResponse.json(
        { error: 'Failed to follow creator' },
        { status: 500 }
      )
    }

    // Create notification for the creator
    await supabase
      .from('notifications')
      .insert({
        user_id: creator_id,
        type: 'follow',
        title: 'New Follower',
        message: `${user.user_metadata?.full_name || user.email} started following you`,
        data: {
          follower_id: user.id,
          follower_name: user.user_metadata?.full_name || user.email
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Successfully followed creator',
      data: followRecord
    })

  } catch (error) {
    console.error('Follow POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/follow - Unfollow a creator
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
    const { creator_id } = body

    if (!creator_id) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', creator_id)

    if (error) {
      console.error('Error unfollowing creator:', error)
      return NextResponse.json(
        { error: 'Failed to unfollow creator' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unfollowed creator'
    })

  } catch (error) {
    console.error('Follow DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}