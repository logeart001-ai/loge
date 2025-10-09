import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const userType = requestUrl.searchParams.get('user_type')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createServerClient()
    
    // Exchange the code for a session
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/auth/auth-error`)
    }

    if (user) {
      console.log('🔥 OAuth user authenticated:', user.id)
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // If no profile exists, create one (for OAuth users)
      if (!existingProfile) {
        console.log('🔥 Creating new profile for OAuth user')
        
        const profileData = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          role: (userType as 'creator' | 'buyer') || 'buyer',
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

      // Get the final user type
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const finalUserType = profile?.role || 'buyer'
      const redirectPath = finalUserType === 'creator' ? '/dashboard/creator' : '/dashboard/collector'

      console.log('🔥 Redirecting to:', redirectPath)
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // If something went wrong, redirect to error page
  console.error('🔥 No code provided in callback')
  return NextResponse.redirect(`${origin}/auth/auth-error`)
}
