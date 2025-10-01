import { createMiddlewareClient } from '@/lib/supabase-middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createMiddlewareClient(request, response)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Protect dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      if (!user) {
        const redirectUrl = new URL('/auth/signin', request.url)
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
      
      // Check if user has completed profile setup
      if (user && !user.email_confirmed_at) {
        return NextResponse.redirect(new URL('/auth/confirm-email', request.url))
      }
    }
    
    // Redirect authenticated users away from auth pages
    if (user && (
      request.nextUrl.pathname.startsWith('/auth/signin') ||
      request.nextUrl.pathname.startsWith('/auth/signup')
    )) {
      const userType = user.user_metadata?.user_type || user.user_metadata?.role
      const dashboardUrl = userType === 'creator' ? '/dashboard/creator' : 
                          userType === 'collector' ? '/dashboard/collector' : '/dashboard'
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }

    return response
  } catch (error) {
    // If there's an error with auth, redirect to signin
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/signin',
    '/auth/signup'
  ]
}