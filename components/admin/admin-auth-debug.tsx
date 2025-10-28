'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'

export function AdminAuthDebug() {
  const [authStatus, setAuthStatus] = useState<{
    isAuthenticated: boolean
    userId: string | null
    email: string | null
    role: string | null
    error: string | null
  }>({
    isAuthenticated: false,
    userId: null,
    email: null,
    role: null,
    error: null
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const supabase = createClient()
    
    try {
      // Check auth session
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        setAuthStatus({
          isAuthenticated: false,
          userId: null,
          email: null,
          role: null,
          error: authError.message
        })
        return
      }

      if (!user) {
        setAuthStatus({
          isAuthenticated: false,
          userId: null,
          email: null,
          role: null,
          error: 'No authenticated user'
        })
        return
      }

      // Fetch user profile to get role
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        setAuthStatus({
          isAuthenticated: true,
          userId: user.id,
          email: user.email || null,
          role: null,
          error: `Profile error: ${profileError.message}`
        })
        return
      }

      setAuthStatus({
        isAuthenticated: true,
        userId: user.id,
        email: user.email || null,
        role: profile?.role || null,
        error: null
      })
    } catch (error) {
      setAuthStatus({
        isAuthenticated: false,
        userId: null,
        email: null,
        role: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-gray-900 mb-3">🔍 Authentication Debug Info</h3>
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium">Status: </span>
          <span className={authStatus.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
            {authStatus.isAuthenticated ? '✓ Authenticated' : '✗ Not Authenticated'}
          </span>
        </div>
        
        {authStatus.userId && (
          <div>
            <span className="font-medium">User ID: </span>
            <code className="bg-gray-200 px-1 py-0.5 rounded">{authStatus.userId}</code>
          </div>
        )}
        
        {authStatus.email && (
          <div>
            <span className="font-medium">Email: </span>
            <span>{authStatus.email}</span>
          </div>
        )}
        
        {authStatus.role && (
          <div>
            <span className="font-medium">Role: </span>
            <span className={authStatus.role === 'admin' ? 'text-green-600 font-semibold' : 'text-orange-600'}>
              {authStatus.role}
            </span>
          </div>
        )}
        
        {authStatus.error && (
          <div>
            <span className="font-medium text-red-600">Error: </span>
            <span className="text-red-600">{authStatus.error}</span>
          </div>
        )}
      </div>
      
      <button
        onClick={checkAuth}
        className="mt-3 text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
      >
        Refresh
      </button>
    </div>
  )
}
