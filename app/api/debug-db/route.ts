import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    // Test database connection
    const results = {
      timestamp: new Date().toISOString(),
      tests: {} as any
    }

    // Test 1: Check auth user
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      results.tests.auth = {
        success: !authError,
        user: user ? { id: user.id, email: user.email } : null,
        error: authError ? JSON.stringify(authError) : null
      }
    } catch (e) {
      results.tests.auth = { success: false, error: String(e) }
    }

    // Test 2: Check profiles table
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      results.tests.profiles_table = {
        success: !error,
        count,
        error: error ? JSON.stringify(error) : null
      }
    } catch (e) {
      results.tests.profiles_table = { success: false, error: String(e) }
    }

    // Test 3: Check user_profiles table
    try {
      const { count, error } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
      results.tests.user_profiles_table = {
        success: !error,
        count,
        error: error ? JSON.stringify(error) : null
      }
    } catch (e) {
      results.tests.user_profiles_table = { success: false, error: String(e) }
    }

    // Test 4: Try to query user_profiles for current user (if authenticated)
    if (results.tests.auth.success && results.tests.auth.user) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, full_name, role')
          .eq('id', results.tests.auth.user.id)
          .single()
        results.tests.user_profile_query = {
          success: !error,
          data,
          error: error ? JSON.stringify(error) : null
        }
      } catch (e) {
        results.tests.user_profile_query = { success: false, error: String(e) }
      }
    }

    // Test 5: Check RLS policies
    try {
      const { data, error } = await supabase
        .rpc('get_my_claims')
      results.tests.rls_claims = {
        success: !error,
        data,
        error: error ? JSON.stringify(error) : null
      }
    } catch (e) {
      results.tests.rls_claims = { success: false, error: String(e) }
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ 
      error: 'Database diagnostic failed', 
      details: String(error) 
    }, { status: 500 })
  }
}