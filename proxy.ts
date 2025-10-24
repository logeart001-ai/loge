import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type SupabaseAuthCookie = {
  access_token?: string
  currentSession?: {
    access_token?: string
  }
}

type SupabaseUser = {
  email_confirmed_at?: string | null
  email?: string
  user_metadata?: Record<string, unknown>
}

const SUPABASE_AUTH_COOKIE_PREFIX = 'sb-'

function getProjectRef() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return null
  }

  const stripped = supabaseUrl.replace(/^https?:\/\//, '')
  const [ref] = stripped.split('.')
  return ref || null
}

function parseSupabaseCookie(rawValue?: string) {
  if (!rawValue) {
    return null
  }

  try {
    // Try multiple decoding approaches
    let decoded = rawValue
    
    // Handle URL encoding
    if (rawValue.includes('%')) {
      decoded = decodeURIComponent(rawValue)
    }
    
    // Handle base64 encoding (common in Supabase cookies)
    if (decoded.startsWith('base64-')) {
      decoded = atob(decoded.substring(7))
    }
    
    // Parse JSON
    const parsed = JSON.parse(decoded) as SupabaseAuthCookie
    console.log('🔥 Successfully parsed cookie:', { hasAccessToken: !!parsed.access_token })
    return parsed
  } catch (error) {
    console.log('🔥 Cookie parsing error:', error)
    
    // Fallback: try to extract access_token directly if it's a simple format
    if (rawValue.includes('access_token')) {
      try {
        // Handle cases where the cookie might be in a different format
        const tokenMatch = rawValue.match(/"access_token":"([^"]+)"/)
        if (tokenMatch) {
          return { access_token: tokenMatch[1] }
        }
      } catch {
        // Ignore fallback errors
      }
    }
    
    return null
  }
}

async function getSupabaseUser(request: NextRequest): Promise<SupabaseUser | null> {
  const projectRef = getProjectRef()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!projectRef || !supabaseUrl || !supabaseAnonKey) {
    return null
  }

  const cookieName = `${SUPABASE_AUTH_COOKIE_PREFIX}${projectRef}-auth-token`
  const cookieValue = request.cookies.get(cookieName)?.value
  
  // Debug: Log all cookies
  const allCookies = request.cookies.getAll()
  console.log('🔥 All cookies:', allCookies.map(c => c.name))
  console.log('🔥 Looking for cookie:', cookieName)
  console.log('🔥 Cookie found:', !!cookieValue)
  
  const parsedCookie = parseSupabaseCookie(cookieValue)
  
  // Debug: Log parsed cookie structure
  if (parsedCookie) {
    console.log('🔥 Parsed cookie keys:', Object.keys(parsedCookie))
  } else {
    console.log('🔥 Failed to parse cookie')
  }

  const accessToken = parsedCookie?.access_token ?? parsedCookie?.currentSession?.access_token
  
  console.log('🔥 Has access token:', !!accessToken)
  console.log('🔥 Access token preview:', accessToken ? `${accessToken.substring(0, 20)}...` : 'none')

  if (!accessToken) {
    console.log('🔥 No access token found in cookie')
    return null
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        accept: 'application/json',
        apikey: supabaseAnonKey,
        authorization: `Bearer ${accessToken}`,
      },
      // Bypass caching to always reflect the latest session state
      cache: 'no-store',
    })

    console.log('🔥 Supabase user API response status:', response.status)

    if (!response.ok) {
      console.log('🔥 Supabase user API failed:', response.statusText)
      return null
    }

    const userData = (await response.json()) as SupabaseUser
    console.log('🔥 User data from API:', { email: userData.email, hasMetadata: !!userData.user_metadata })
    return userData
  } catch {
    return null
  }
}

export default async function proxy(request: NextRequest) {
  const user = await getSupabaseUser(request)
  
  console.log('🔥 Proxy middleware:', {
    path: request.nextUrl.pathname,
    hasUser: !!user,
    userEmail: user?.email ?? null
  })

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      const redirectUrl = new URL('/auth/signin', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    if (!user.email_confirmed_at) {
      return NextResponse.redirect(new URL('/auth/confirm-email', request.url))
    }
  }

  if (
    user &&
    (request.nextUrl.pathname.startsWith('/auth/signin') ||
      request.nextUrl.pathname.startsWith('/auth/signup'))
  ) {
    const metadata = (user.user_metadata ?? {}) as { user_type?: string; role?: string }
    const userType = metadata.user_type ?? metadata.role

    const dashboardUrl =
      userType === 'creator'
        ? '/dashboard/creator'
        : userType === 'collector'
          ? '/dashboard/collector'
          : '/dashboard'

    return NextResponse.redirect(new URL(dashboardUrl, request.url))
  }

  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/signin',
    '/auth/signup'
  ]
}