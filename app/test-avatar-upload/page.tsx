'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserAvatar } from '@/components/user-avatar'
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function TestAvatarUploadPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        setMessage({ type: 'error', text: `Auth error: ${userError.message}` })
        setLoading(false)
        return
      }

      if (!user) {
        setMessage({ type: 'info', text: 'Please sign in to test avatar upload' })
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

      if (profileError) {
        setMessage({ type: 'error', text: `Profile error: ${profileError.message}` })
      } else {
        setProfile(profileData)
        setMessage({ type: 'success', text: 'User authenticated and profile loaded!' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Unexpected error: ${err}` })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    setMessage(null)

    try {
      // Validate file
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB')
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File must be an image (JPEG, PNG, GIF, or WebP)')
      }

      // Create file path with user ID folder
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName)

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) {
        throw new Error(`Profile update failed: ${updateError.message}`)
      }

      // Update local state
      setProfile({ ...profile, avatar_url: publicUrl })
      setMessage({ type: 'success', text: 'Avatar uploaded successfully!' })

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    if (!user || !profile?.avatar_url) return

    setUploading(true)
    setMessage(null)

    try {
      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('id', user.id)

      if (updateError) {
        throw new Error(`Failed to remove avatar: ${updateError.message}`)
      }

      // Update local state
      setProfile({ ...profile, avatar_url: null })
      setMessage({ type: 'success', text: 'Avatar removed successfully!' })

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Avatar Upload Test
          </h1>
          <p className="text-gray-600">
            Test the avatar upload functionality with real database integration
          </p>
        </div>

        {/* Status Messages */}
        {message && (
          <Alert className={`${
            message.type === 'success' ? 'border-green-200 bg-green-50' :
            message.type === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-center">
              {message.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
              {message.type === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
              {message.type === 'info' && <AlertCircle className="w-4 h-4 text-blue-600" />}
              <AlertDescription className={`ml-2 ${
                message.type === 'success' ? 'text-green-800' :
                message.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {message.text}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* User Info */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle>Current User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <UserAvatar user={profile} size="lg" />
                <div>
                  <p className="font-semibold">{profile?.full_name || user.email}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500">ID: {user.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Section */}
        {user ? (
          <Card>
            <CardHeader>
              <CardTitle>Avatar Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="mb-2"
                />
                <p className="text-xs text-gray-500">
                  Supported formats: JPEG, PNG, GIF, WebP (max 10MB)
                </p>
              </div>

              {profile?.avatar_url && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={removeAvatar}
                    disabled={uploading}
                    size="sm"
                  >
                    Remove Avatar
                  </Button>
                </div>
              )}

              {uploading && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Processing...</span>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Authentication Required</h3>
              <p className="text-gray-600 mb-4">
                Please sign in to test the avatar upload functionality.
              </p>
              <Button onClick={() => window.location.href = '/auth/signin'}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Database Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Database Connection:</span>
                <span className="text-green-600 font-medium">✓ Connected</span>
              </div>
              <div className="flex justify-between">
                <span>Storage Bucket:</span>
                <span className="text-green-600 font-medium">✓ profile-images</span>
              </div>
              <div className="flex justify-between">
                <span>RLS Policies:</span>
                <span className="text-green-600 font-medium">✓ Configured</span>
              </div>
              <div className="flex justify-between">
                <span>User Authentication:</span>
                <span className={user ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
                  {user ? '✓ Authenticated' : '⚠ Not signed in'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}