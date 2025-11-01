'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      // Check if user is authenticated
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      setUser(authUser)

      // Try to check if user has admin role from profiles table
      // First try 'profiles' (Supabase default), then 'user_profiles'
      let profile = null
      let profileError = null

      // Try profiles table first
      const { data: profileData1, error: error1 } = await supabase
        .from('profiles')
        .select('role, full_name, email')
        .eq('id', authUser.id)
        .single()

      if (!error1 && profileData1) {
        profile = profileData1
      } else {
        // Try user_profiles table
        const { data: profileData2, error: error2 } = await supabase
          .from('user_profiles')
          .select('role, full_name, email')
          .eq('id', authUser.id)
          .single()

        if (!error2 && profileData2) {
          profile = profileData2
        } else {
          profileError = error2 || error1
        }
      }

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        console.log('Tried both "profiles" and "user_profiles" tables')
        setIsAdmin(false)
        setLoading(false)
        return
      }

      // Check if user is admin
      const hasAdminAccess = profile?.role === 'admin'
      setIsAdmin(hasAdminAccess)
      
    } catch (error) {
      console.error('Error checking admin access:', error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying admin access...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You must be signed in to access the admin panel.
            </p>
            <div className="space-y-2">
              <Link href="/auth/signin" className="block">
                <Button className="w-full">Sign In</Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-700">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You don't have permission to access the admin panel.
            </p>
            <p className="text-sm text-gray-500">
              Admin access is required to view this page.
            </p>
            <div className="space-y-2">
              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is admin - render admin panel
  return <>{children}</>
}