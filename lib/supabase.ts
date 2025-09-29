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

export function createServerClient() {
  const cookiesFn = getCookiesApi()
  if (!cookiesFn) {
    throw new Error('createServerClient called in a non-server context')
  }
  const cookieStore = cookiesFn() as any
  const safeGetAll = typeof cookieStore.getAll === 'function' ? () => cookieStore.getAll() : () => []
  type CookieSetOptions = { path?: string; domain?: string; maxAge?: number; expires?: Date; httpOnly?: boolean; secure?: boolean; sameSite?: 'lax' | 'strict' | 'none' | boolean }
  const safeSet = typeof cookieStore.set === 'function'
    ? (name: string, value: string, options?: CookieSetOptions) => cookieStore.set(name, value, options)
    : () => {}
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => safeGetAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            try { safeSet(name, value, options) } catch { /* ignore */ }
          })
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
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
