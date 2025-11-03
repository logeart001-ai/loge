import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // Test auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    const result: any = {
      timestamp: new Date().toISOString(),
      auth: {
        success: !authError,
        user: user ? {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        } : null,
        error: authError ? {
          message: authError.message,
          status: authError.status
        } : null
      }
    }

    // If user exists, try to get their profile
    if (user) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, full_name, role, created_at')
          .eq('id', user.id)
          .single()

        result.profile = {
          success: !profileError,
          data: profile,
          error: profileError ? {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details
          } : null
        }
      } catch (e) {
        result.profile = {
          success: false,
          error: e instanceof Error ? e.message : String(e)
        }
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({
      error: 'Auth test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}