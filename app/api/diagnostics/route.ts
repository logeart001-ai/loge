import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  const diagnostics: {
    timestamp: string
    environment: string | undefined
    checks: Record<string, boolean | string | undefined>
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

  // Test Supabase connection using basic client (not server client)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      diagnostics.errors.push('Missing Supabase environment variables')
    } else {
      // Use basic Supabase client for diagnostics
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      // Test connection with a simple query
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        diagnostics.checks.supabaseConnection = false
        diagnostics.errors.push(`Auth session error: ${error.message}`)
      } else {
        diagnostics.checks.supabaseConnection = true
        diagnostics.checks.hasSession = !!data.session
      }
    }
  } catch (error) {
    diagnostics.checks.supabaseConnection = false
    diagnostics.errors.push(`Supabase client error: ${error instanceof Error ? error.message : 'Unknown'}`)
  }

  return NextResponse.json(diagnostics, { 
    status: diagnostics.errors.length > 0 ? 500 : 200 
  })
}
