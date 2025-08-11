'use server'

import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export async function signUp(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const userType = formData.get('userType') as string

  if (!email || !password || !fullName || !userType) {
    return {
      error: 'All fields are required'
    }
  }

  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`
      }
    })

    if (error) {
      return {
        error: error.message
      }
    }

    return {
      success: true,
      message: 'Check your email to confirm your account',
      redirectTo: '/auth/confirmed'
    }
  } catch (error) {
    return {
      error: 'An unexpected error occurred'
    }
  }
}

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return {
      error: 'Email and password are required'
    }
  }

  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        error: error.message
      }
    }

    return {
      success: true,
      message: 'Successfully signed in',
      redirectTo: data.user?.user_metadata?.user_type === 'creator' ? '/dashboard/creator' : '/dashboard/buyer'
    }
  } catch (error) {
    return {
      error: 'An unexpected error occurred'
    }
  }
}

export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function requireAuth() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  return user
}

export async function resendConfirmation(prevState: any, formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    return {
      error: 'Email is required'
    }
  }

  try {
    const supabase = await createServerClient()
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`
      }
    })

    if (error) {
      return {
        error: error.message
      }
    }

    return {
      success: true,
      message: 'Confirmation email sent! Check your inbox.'
    }
  } catch (error) {
    return {
      error: 'An unexpected error occurred'
    }
  }
}

export async function updateUserProfile(prevState: any, formData: FormData) {
  const fullName = formData.get('fullName') as string
  const bio = formData.get('bio') as string
  const location = formData.get('location') as string
  const discipline = formData.get('discipline') as string
  const instagram = formData.get('instagram') as string
  const twitter = formData.get('twitter') as string
  const website = formData.get('website') as string

  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        error: 'Not authenticated'
      }
    }

    // First, try to insert or update the user profile
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        bio,
        location,
        discipline,
        social_links: {
          instagram,
          twitter,
          website
        },
        updated_at: new Date().toISOString()
      })

    if (error) {
      return {
        error: error.message
      }
    }

    return {
      success: true,
      message: 'Profile updated successfully'
    }
  } catch (error) {
    return {
      error: 'An unexpected error occurred'
    }
  }
}
