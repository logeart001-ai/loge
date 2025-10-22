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
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          return cookieStore.getAll()
        },
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Only set cookies in contexts where it's allowed
              if (typeof cookieStore.set === 'function') {
                cookieStore.set(name, value, {
                  ...options,
                  path: '/',
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                })
              }
            })
          } catch (error) {
            // Silently fail in read-only contexts (like static generation)
            // This is expected behavior in Next.js 15
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
