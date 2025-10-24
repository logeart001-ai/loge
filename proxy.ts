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

  const decoded = rawValue.startsWith('%7B') ? decodeURIComponent(rawValue) : rawValue

  try {
    return JSON.parse(decoded) as SupabaseAuthCookie
  } catch {
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
  const parsedCookie = parseSupabaseCookie(cookieValue)

  const accessToken = parsedCookie?.access_token ?? parsedCookie?.currentSession?.access_token

  if (!accessToken) {
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

    if (!response.ok) {
      return null
    }

    return (await response.json()) as SupabaseUser
  } catch {
    return null
  }
}

export default async function proxy(request: NextRequest) {
  const user = await getSupabaseUser(request)

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