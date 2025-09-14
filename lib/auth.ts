'use server'

import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

// Password validation helper
function validatePassword(password: string): { isValid: boolean; message?: string } {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (password.length < minLength) {
    return { isValid: false, message: 'Password must be at least 8 characters long' }
  }
  if (!hasUpperCase) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' }
  }
  if (!hasLowerCase) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' }
  }
  if (!hasNumbers) {
    return { isValid: false, message: 'Password must contain at least one number' }
  }
  if (!hasSpecialChar) {
    return { isValid: false, message: 'Password must contain at least one special character' }
  }

  return { isValid: true }
}

// Email validation helper
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function signUp(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const userType = formData.get('userType') as string

  // Enhanced validation
  if (!email || !password || !fullName || !userType) {
    return {
      error: 'All fields are required'
    }
  }

  if (!validateEmail(email)) {
    return {
      error: 'Please enter a valid email address'
    }
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    return {
      error: passwordValidation.message
    }
  }

  if (fullName.trim().length < 2) {
    return {
      error: 'Full name must be at least 2 characters long'
    }
  }

  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
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

    // Create user profile after successful signup
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName.trim(),
          role: userType === 'creator' ? 'creator' : 'buyer',
          creator_status: userType === 'creator' ? 'pending' : null,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't fail the signup if profile creation fails
      }
    }

    return {
      success: true,
      message: 'Account created successfully! Please check your email to confirm your account.',
      redirectTo: '/auth/confirmed'
    }
  } catch (error) {
    console.error('Signup error:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string

  if (!email || !password) {
    return {
      error: 'Email and password are required'
    }
  }

  if (!validateEmail(email)) {
    return {
      error: 'Please enter a valid email address'
    }
  }

  try {
    const supabase = await createServerClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (error) {
      // Provide more user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        return {
          error: 'Invalid email or password. Please check your credentials and try again.'
        }
      }
      if (error.message.includes('Email not confirmed')) {
        return {
          error: 'Please confirm your email address before signing in. Check your inbox for a confirmation email.'
        }
      }
      return {
        error: error.message
      }
    }

    // Determine redirect URL
    const userType = data.user?.user_metadata?.user_type
    const defaultRedirect = userType === 'creator' ? '/dashboard/creator' : '/dashboard/buyer'
    const finalRedirect = redirectTo || defaultRedirect

    return {
      success: true,
      message: 'Successfully signed in! Redirecting...',
      redirectTo: finalRedirect
    }
  } catch (error) {
    console.error('Signin error:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
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

  if (!validateEmail(email)) {
    return {
      error: 'Please enter a valid email address'
    }
  }

  try {
    const supabase = await createServerClient()
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase().trim(),
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
      message: 'Confirmation email sent! Check your inbox and spam folder.'
    }
  } catch (error) {
    console.error('Resend confirmation error:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

export async function resetPassword(prevState: any, formData: FormData) {
  const email = formData.get('email') as string

  if (!email) {
    return {
      error: 'Email is required'
    }
  }

  if (!validateEmail(email)) {
    return {
      error: 'Please enter a valid email address'
    }
  }

  try {
    const supabase = await createServerClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
    })

    if (error) {
      return {
        error: error.message
      }
    }

    return {
      success: true,
      message: 'Password reset email sent! Check your inbox for instructions.'
    }
  } catch (error) {
    console.error('Password reset error:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

export async function updatePassword(prevState: any, formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || !confirmPassword) {
    return {
      error: 'Both password fields are required'
    }
  }

  if (password !== confirmPassword) {
    return {
      error: 'Passwords do not match'
    }
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    return {
      error: passwordValidation.message
    }
  }

  try {
    const supabase = await createServerClient()
    
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      return {
        error: error.message
      }
    }

    return {
      success: true,
      message: 'Password updated successfully!',
      redirectTo: '/dashboard'
    }
  } catch (error) {
    console.error('Password update error:', error)
    return {
      error: 'An unexpected error occurred. Please try again.'
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
