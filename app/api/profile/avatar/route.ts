import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    const { avatar_url } = await req.json()

    // Update user profile with new avatar URL
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('id, avatar_url, full_name')
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ 
        error: 'Failed to update profile',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile: data
    })

  } catch (error) {
    console.error('Avatar update API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 })
    }

    // Remove avatar URL from user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('id, avatar_url, full_name')
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ 
        error: 'Failed to remove avatar',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile: data
    })

  } catch (error) {
    console.error('Avatar removal API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}