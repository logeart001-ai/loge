'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthDebugPage() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any>({})

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error.message)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session)
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const testSupabaseConnection = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
      
      setTestResults(prev => ({
        ...prev,
        supabaseConnection: error ? `Error: ${error.message}` : 'Success'
      }))
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        supabaseConnection: `Error: ${err}`
      }))
    }
  }

  const testSignIn = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword'
      })
      
      setTestResults(prev => ({
        ...prev,
        signInTest: error ? `Error: ${error.message}` : 'Success (or user not found - which is expected)'
      }))
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        signInTest: `Error: ${err}`
      }))
    }
  }

  const checkEnvironmentVars = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    setTestResults(prev => ({
      ...prev,
      envVars: {
        url: supabaseUrl ? 'Set' : 'Missing',
        key: supabaseKey ? 'Set' : 'Missing',
        urlValue: supabaseUrl?.substring(0, 20) + '...' || 'Not set',
        keyValue: supabaseKey?.substring(0, 20) + '...' || 'Not set'
      }
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug Page</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Auth State */}
          <Card>
            <CardHeader>
              <CardTitle>Current Authentication State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong>User:</strong> {user ? 'Signed In' : 'Not Signed In'}
                </div>
                {user && (
                  <div className="space-y-2">
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>ID:</strong> {user.id}</div>
                    <div><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</div>
                  </div>
                )}
                {session && (
                  <div>
                    <strong>Session:</strong> Active
                  </div>
                )}
                {error && (
                  <div className="text-red-600">
                    <strong>Error:</strong> {error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={checkEnvironmentVars} className="w-full">
                  Check Environment Variables
                </Button>
                <Button onClick={testSupabaseConnection} className="w-full">
                  Test Supabase Connection
                </Button>
                <Button onClick={testSignIn} className="w-full">
                  Test Sign In Function
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button onClick={() => window.location.href = '/auth/signin'}>
            Go to Sign In Page
          </Button>
        </div>
      </div>
    </div>
  )
}