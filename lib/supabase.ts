// Unified Supabase helpers.
// IMPORTANT: This file is imported by both server and client code.
// We use conditional imports to handle server-only dependencies.

import { createServerClient as createSupabaseServerClient, createBrowserClient } from '@supabase/ssr'

type CookieSetOptions = { 
  path?: string
  domain?: string
  maxAge?: number
  expires?: Date
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none' | boolean 
}

interface CookieStoreLike {
  getAll: () => { name: string; value: string }[]
  set: (name: string, value: string, options?: CookieSetOptions) => void
}

export async function createServerClient() {
  // Dynamically import cookies only when needed (server-side)
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  
  const typedCookieStore = cookieStore as unknown as CookieStoreLike
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          return typedCookieStore.getAll()
        },
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Ensure proper cookie options for production
              const cookieOptions: CookieSetOptions = {
                ...options,
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              }
              typedCookieStore.set(name, value, cookieOptions)
            })
          } catch (error) {
            // In some contexts (like middleware), cookies may be read-only
            console.error('Failed to set cookies:', error)
          }
        }
      }
    }
  )
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function isServer() {
  return typeof window === 'undefined'
}

export async function safeGetUser() {
  if (!isServer()) return null
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
