'use server'

import { createServerActionClient } from '@/lib/supabase-server'
import { headers } from 'next/headers'

export async function sendMagicLink(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const userType = formData.get('userType') as string || 'collector'

  if (!email) {
    return {
      error: 'Email is required'
    }
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      error: 'Please enter a valid email address'
    }
  }

  try {
    const supabase = await createServerActionClient()
    const headersList = await headers()
    const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback?user_type=${userType}`,
        data: {
          user_type: userType === 'creator' ? 'creator' : 'buyer',
          role: userType === 'creator' ? 'creator' : 'buyer'
        }
      }
    })

    if (error) {
      console.error('Magic link error:', error)
      return {
        error: error.message
      }
    }

    return {
      success: true,
      message: 'Check your email! We\'ve sent you a magic link to sign in.',
      email
    }
  } catch (error) {
    console.error('Magic link catch error:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

export async function signUpWithMagicLink(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string
  const fullName = formData.get('fullName') as string
  const userType = formData.get('userType') as string || 'collector'

  if (!email || !fullName) {
    return {
      error: 'Name and email are required'
    }
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      error: 'Please enter a valid email address'
    }
  }

  if (fullName.trim().length < 2) {
    return {
      error: 'Full name must be at least 2 characters long'
    }
  }

  try {
    const supabase = await createServerActionClient()
    const headersList = await headers()
    const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const mappedRole = userType === 'creator' ? 'creator' : 'buyer'

    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback?user_type=${userType}&welcome=true`,
        data: {
          full_name: fullName.trim(),
          user_type: mappedRole,
          role: mappedRole
        }
      }
    })

    if (error) {
      console.error('Magic link signup error:', error)
      return {
        error: error.message
      }
    }

    return {
      success: true,
      message: 'Check your email! We\'ve sent you a magic link to complete your account setup.',
      email
    }
  } catch (error) {
    console.error('Magic link signup catch error:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}