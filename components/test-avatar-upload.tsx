'use client'

import { useState, useEffect } from 'react'
import { ProfileAvatarUpload } from '@/components/profile-avatar-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase-client'
import { User } from '@supabase/supabase-js'

export function TestAvatarUpload() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setError('Please sign in to test avatar upload')
        setLoading(false)
        return
      }

      setUser(user)

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile error:', profileError)
        setError('Failed to load profile')
      } else {
        setProfile(profileData)
        setAvatarUrl(profileData?.avatar_url || '')
      }

    } catch (err) {
      console.error('Load user data error:', err)
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpdate = (newUrl: string) => {
    setAvatarUrl(newUrl)
    // Reload profile to get updated data
    loadUserData()
  }

  const testStorageAccess = async () => {
    try {
      // Test if we can access the profile-images bucket
      const { data, error } = await supabase.storage
        .from('profile-images')
        .list('', { limit: 1 })

      if (error) {
        alert(`Storage test failed: ${error.message}`)
      } else {
        alert('✅ Storage access test passed! Avatar upload should work.')
      }
    } catch (err) {
      alert(`Storage test error: ${err}`)
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">❌ {error}</div>
          <Button onClick={loadUserData}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 mb-4">Please sign in to test avatar upload</p>
          <Button onClick={() => window.location.href = '/auth/signin'}>
            Sign In
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test Avatar Upload</CardTitle>
          <p className="text-sm text-gray-600">
            Signed in as: <strong>{profile?.full_name || user.email}</strong>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <ProfileAvatarUpload
              currentAvatarUrl={avatarUrl}
              userId={user.id}
              userName={profile?.full_name || user.email || 'User'}
              onAvatarUpdate={handleAvatarUpdate}
            />
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Current avatar URL: 
            </p>
            <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
              {avatarUrl || 'No avatar set'}
            </p>
          </div>

          <Button 
            onClick={testStorageAccess} 
            variant="outline" 
            className="w-full"
          >
            Test Storage Access
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-sm">Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <div><strong>User ID:</strong> {user.id}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Profile Role:</strong> {profile?.role || 'No profile'}</div>
          <div><strong>Profile Created:</strong> {profile?.created_at || 'No profile'}</div>
        </CardContent>
      </Card>
    </div>
  )
}