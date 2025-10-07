import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const diagnostics: {
    timestamp: string
    environment: string | undefined
    checks: Record<string, boolean | string>
    errors: string[]
  } = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'missing',
    },
    errors: []
  }

  // Test Supabase connection
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      diagnostics.errors.push(`Auth session error: ${error.message}`)
    } else {
      diagnostics.checks = {
        ...diagnostics.checks,
        supabaseConnection: true,
        hasSession: !!data.session,
      }
    }
  } catch (error) {
    diagnostics.errors.push(`Supabase client error: ${error instanceof Error ? error.message : 'Unknown'}`)
  }

  return NextResponse.json(diagnostics, { 
    status: diagnostics.errors.length > 0 ? 500 : 200 
  })
}
