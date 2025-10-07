// Unified Supabase helpers.
// IMPORTANT: This file is imported by both server and client code.
// Avoid directly importing `cookies` (server-only) in the module body
// to prevent Next.js from flagging it when included in client bundles.

import { createServerClient as createSupabaseServerClient, createBrowserClient } from '@supabase/ssr'

// Lazy getter to avoid bundling server-only APIs into client graph.
function getCookiesApi() {
  try {
    // Using dynamic import to avoid bundling in client builds.
    const mod = (eval('require') as NodeRequire)('next/headers') as typeof import('next/headers')
    return mod.cookies
  } catch {
    return null
  }
}

export async function createServerClient() {
  const cookiesFn = getCookiesApi()
  if (!cookiesFn) {
    throw new Error('createServerClient called in a non-server context')
  }
  
  try {
    // Await the cookies function for Next.js 15 compatibility
    const cookieStore = await cookiesFn()
    
    // Narrow structural typing instead of any to satisfy linting.
    interface CookieStoreLike {
      getAll?: () => { name: string; value: string }[]
      set?: (name: string, value: string, options?: CookieSetOptions) => void
    }
    
    const typedCookieStore = cookieStore as unknown as CookieStoreLike
    const cookieGetAll = typedCookieStore.getAll
    const safeGetAll = typeof cookieGetAll === 'function' ? () => cookieGetAll.call(typedCookieStore) : () => []
    type CookieSetOptions = { path?: string; domain?: string; maxAge?: number; expires?: Date; httpOnly?: boolean; secure?: boolean; sameSite?: 'lax' | 'strict' | 'none' | boolean }
    const cookieSet = typedCookieStore.set
    const safeSet = typeof cookieSet === 'function'
      ? (name: string, value: string, options?: CookieSetOptions) => cookieSet.call(typedCookieStore, name, value, options)
      : () => {}
    return createSupabaseServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => safeGetAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              try { 
                // Ensure proper cookie options for production
                const cookieOptions = {
                  ...options,
                  path: '/',
                  sameSite: 'lax' as const,
                  secure: process.env.NODE_ENV === 'production',
                }
                safeSet(name, value, cookieOptions) 
              } catch (error) { 
                console.error('Failed to set cookie:', name, error)
              }
            })
          }
        }
      }
    )
  } catch (error) {
    console.error('Failed to create server client:', error)
    throw error
  }
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
