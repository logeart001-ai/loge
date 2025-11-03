'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { fileUploadService } from '@/lib/file-upload'
import { createClient } from '@/lib/supabase-client'

interface ProfileAvatarUploadProps {
  currentAvatarUrl?: string | null
  userId: string
  userName: string
  onAvatarUpdate: (newAvatarUrl: string) => void
}

export function ProfileAvatarUpload({ 
  currentAvatarUrl, 
  userId, 
  userName, 
  onAvatarUpdate 
}: ProfileAvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit for profile pictures
      setError('Image must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      // Upload to profile-images bucket
      const result = await fileUploadService.uploadFile(
        file,
        'profile-images',
        userId, // Use user ID as folder path
        { upsert: true } // Allow overwriting existing avatar
      )

      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: result.url })
        .eq('id', userId)

      if (updateError) {
        throw new Error('Failed to update profile')
      }

      // Call parent callback
      onAvatarUpdate(result.url!)
      setPreviewUrl(null) // Clear preview since we now have the real URL

    } catch (error) {
      console.error('Avatar upload error:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const removeAvatar = async () => {
    setIsUploading(true)
    setError(null)

    try {
      // Update user profile to remove avatar
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (updateError) {
        throw new Error('Failed to remove avatar')
      }

      // Call parent callback
      onAvatarUpdate('')
      setPreviewUrl(null)

    } catch (error) {
      console.error('Avatar removal error:', error)
      setError(error instanceof Error ? error.message : 'Failed to remove avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const displayUrl = previewUrl || currentAvatarUrl
  const initials = userName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
          <AvatarImage src={displayUrl || undefined} alt={userName} />
          <AvatarFallback className="text-lg font-semibold bg-orange-100 text-orange-600">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload Overlay */}
        <button
          onClick={triggerFileSelect}
          disabled={isUploading}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200 disabled:cursor-not-allowed"
          aria-label="Upload new profile picture"
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Upload Controls */}
      <div className="flex flex-col items-center space-y-2">
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={triggerFileSelect}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {currentAvatarUrl ? 'Change Photo' : 'Upload Photo'}
          </Button>
          
          {currentAvatarUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removeAvatar}
              disabled={isUploading}
            >
              <X className="w-4 h-4 mr-2" />
              Remove
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center">
          JPG, PNG or GIF. Max size 5MB.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded-md text-center">
          {error}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Select profile picture"
      />
    </div>
  )
}