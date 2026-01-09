import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { headers } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()
    const artworkId = params.id

    // Get session ID from cookie or generate new one
    const sessionId = request.cookies.get('session_id')?.value || 
                     `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Get user if authenticated
    const { data: { user } } = await supabase.auth.getUser()

    // Get IP and user agent
    const headersList = await headers()
    const forwardedFor = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const viewerIp = forwardedFor?.split(',')[0] || realIp || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    // Check if this session already viewed this artwork in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { data: recentView } = await supabase
      .from('artwork_views')
      .select('id')
      .eq('artwork_id', artworkId)
      .eq('session_id', sessionId)
      .gte('viewed_at', oneHourAgo)
      .single()

    // Only track if no recent view from this session
    if (!recentView) {
      const { error } = await supabase
        .from('artwork_views')
        .insert({
          artwork_id: artworkId,
          viewer_id: user?.id || null,
          viewer_ip: viewerIp,
          user_agent: userAgent,
          session_id: sessionId,
        })

      if (error) {
        console.error('Error tracking view:', error)
        // Don't fail the request if view tracking fails
      }
    }

    // Set session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (error) {
    console.error('Error in view tracking:', error)
    // Return success even on error to not break the page
    return NextResponse.json({ success: true })
  }
}
