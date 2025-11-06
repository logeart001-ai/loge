import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'
  const welcome = searchParams.get('welcome')
  const origin = new URL(request.url).origin

  if (token_hash && type) {
    const supabase = await createServerClient()

    const { data, error } = await supabase.auth.verifyOtp({
      type: type as 'signup' | 'recovery' | 'invite' | 'magiclink',
      token_hash,
    })

    if (!error && data.user) {
      console.log('🔥 Magic link user authenticated:', data.user.id)
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      // If no profile exists, create one (for magic link users)
      if (!existingProfile) {
        console.log('🔥 Creating new profile for magic link user')
        
        const userType = data.user.user_metadata?.user_type || data.user.user_metadata?.role || 'buyer'
        
        const profileData = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
          avatar_url: data.user.user_metadata?.avatar_url || null,
          role: userType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert(profileData)

        if (profileError) {
          console.error('Error creating profile:', profileError)
          // Continue anyway, profile might be created by trigger
        } else {
          console.log('🔥 Profile created successfully')
        }
      } else {
        console.log('🔥 Profile already exists for user')
      }

      // Get the final user type for proper redirect
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const finalUserType = profile?.role || 'buyer'
      
      // Determine redirect path
      let redirectPath = next
      if (next === '/dashboard') {
        redirectPath = finalUserType === 'creator' ? '/dashboard/creator' : '/dashboard/collector'
      }

      console.log('🔥 Magic link redirecting to:', redirectPath)
      
      if (welcome) {
        // For new signups, show welcome page first
        return NextResponse.redirect(new URL(`/auth/confirmed?next=${redirectPath}&welcome=true`, request.url))
      } else {
        // For existing users, redirect directly
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
    }

    if (error) {
      console.error('Magic link verification error:', error)
      return NextResponse.redirect(new URL(`/auth/auth-error?error=${encodeURIComponent(error.message)}`, request.url))
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL('/auth/auth-error?error=Invalid or expired authentication link', request.url))
}
