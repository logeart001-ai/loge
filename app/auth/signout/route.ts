import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// POST /auth/signout -> clears Supabase session cookies on the server
export async function POST() {
  console.log('🔥 POST /auth/signout called')
  try {
    const supabase = await createServerClient()
    console.log('🔥 Supabase client created, attempting signOut...')
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.log('🔥 Supabase signOut error:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log('🔥 Supabase signOut successful')
    return NextResponse.json({ success: true })
  } catch (err) {
    console.log('🔥 POST /auth/signout catch error:', err)
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
