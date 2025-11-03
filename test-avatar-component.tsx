// Test component for avatar upload functionality
'use client'

import { useState } from 'react'
import { ProfileAvatarUpload } from '@/components/profile-avatar-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAvatarComponent() {
  const [avatarUrl, setAvatarUrl] = useState<string>('')

  // Mock user data for testing
  const mockUser = {
    id: '8b396cf6-6110-45a6-a41a-d0d6fa2ee025', // Your actual user ID
    email: 'stephenmayowa112@gmail.com',
    user_metadata: {
      full_name: 'Stephen Mayowa'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Avatar Upload</CardTitle>
            <p className="text-gray-600">Test the profile picture upload functionality</p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ProfileAvatarUpload
              currentAvatarUrl={avatarUrl}
              userId={mockUser.id}
              userName={mockUser.user_metadata.full_name}
              onAvatarUpdate={(newUrl) => {
                console.log('Avatar updated:', newUrl)
                setAvatarUrl(newUrl)
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}