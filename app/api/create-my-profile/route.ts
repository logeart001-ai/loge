import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = await createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        details: authError?.message 
      }, { status: 401 })
    }

    // Create profile for the current user
    const { data: profile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: 'admin', // Making you admin since you're setting this up
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, full_name, role, created_at')
      .single()

    if (createError) {
      // If profile already exists, update it to admin
      if (createError.code === '23505') { // Unique constraint violation
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            role: 'admin',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select('id, full_name, role, created_at')
          .single()

        if (updateError) {
          return NextResponse.json({
            error: 'Failed to update profile',
            details: updateError.message
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: 'Profile updated to admin',
          user: {
            id: user.id,
            email: user.email
          },
          profile: updatedProfile
        })
      }

      return NextResponse.json({
        error: 'Failed to create profile',
        details: createError.message,
        code: createError.code
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Admin profile created successfully',
      user: {
        id: user.id,
        email: user.email
      },
      profile
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Profile creation failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}