import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// POST /auth/signout -> clears Supabase session cookies on the server
export async function POST() {
  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 })
  }
}

// GET /auth/signout -> optional convenience endpoint to sign out and redirect
export async function GET(req: Request) {
  try {
    const supabase = await createServerClient()
    await supabase.auth.signOut()
  } catch {}
  return NextResponse.redirect(new URL('/auth/signin', req.url))
}
