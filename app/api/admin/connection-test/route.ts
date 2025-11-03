import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {} as any
  }

  try {
    // Test 1: Basic Supabase client creation
    console.log('Testing Supabase client creation...')
    const supabase = await createServerClient()
    results.tests.client_creation = { success: true }

    // Test 2: Authentication check
    console.log('Testing authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    results.tests.authentication = {
      success: !authError,
      user_id: user?.id || null,
      error: authError ? authError.message : null
    }

    // Test 3: Basic database connectivity
    console.log('Testing database connectivity...')
    const { data: testData, error: dbError } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true })

    results.tests.database_connectivity = {
      success: !dbError,
      count: testData || null,
      error: dbError ? dbError.message : null
    }

    // Test 4: Admin API access (if authenticated)
    if (user) {
      console.log('Testing admin API access...')
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        results.tests.admin_access = {
          success: true,
          is_admin: profile?.role === 'admin',
          user_role: profile?.role || 'no_profile'
        }
      } catch (adminError) {
        results.tests.admin_access = {
          success: false,
          error: adminError instanceof Error ? adminError.message : 'Unknown error'
        }
      }
    }

    // Test 5: Service role access (for admin users API)
    if (user && results.tests.admin_access?.is_admin) {
      console.log('Testing service role access...')
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const adminSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )

        const { data: authUsers, error: usersError } = await adminSupabase.auth.admin.listUsers({
          page: 1,
          perPage: 1
        })

        results.tests.service_role_access = {
          success: !usersError,
          user_count: authUsers?.users?.length || 0,
          error: usersError ? usersError.message : null
        }
      } catch (serviceError) {
        results.tests.service_role_access = {
          success: false,
          error: serviceError instanceof Error ? serviceError.message : 'Unknown error'
        }
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Connection test failed:', error)
    return NextResponse.json({
      ...results,
      error: 'Connection test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}