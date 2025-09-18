'use client'

import { useActionState } from 'react'
import { updateUserProfile } from '@/lib/auth'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Link from 'next/link'

interface User {
  id: string
  email: string
  full_name: string
  role: 'collector' | 'creator'
  bio?: string
  location?: string
  discipline?: string
  avatar_url?: string
  social_links?: {
    instagram?: string
    twitter?: string
    website?: string
  }
  created_at: string
}

interface ProfileFormProps {
  user: User
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [state, action, isPending] = useActionState(updateUserProfile, null)

  return (
    <form action={action} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            name="full_name"
            defaultValue={user.full_name}
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">Contact support to change your name</p>
        </div>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            defaultValue={user.email}
            disabled
            className="bg-gray-50"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          placeholder="Tell us about yourself and your artistic journey..."
          defaultValue={user.bio || ''}
          rows={4}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            placeholder="e.g., Lagos, Nigeria"
            defaultValue={user.location || ''}
          />
        </div>
        
        <div>
          <Label htmlFor="discipline">Artistic Discipline</Label>
          <Input
            id="discipline"
            name="discipline"
            placeholder="e.g., Painting, Sculpture, Digital Art"
            defaultValue={user.discipline || ''}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Social Links</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              name="instagram"
              placeholder="@username"
              defaultValue={user.social_links?.instagram || ''}
            />
          </div>
          
          <div>
            <Label htmlFor="twitter">Twitter/X</Label>
            <Input
              id="twitter"
              name="twitter"
              placeholder="@username"
              defaultValue={user.social_links?.twitter || ''}
            />
          </div>
          
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              placeholder="https://yourwebsite.com"
              defaultValue={user.social_links?.website || ''}
            />
          </div>
        </div>
      </div>

      {state?.error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="text-brand-yellow text-sm bg-brand-yellow/10 p-3 rounded">
          {state.message}
        </div>
      )}

      <div className="flex gap-4">
        <Button 
          type="submit" 
          className="bg-orange-500 hover:bg-orange-600"
          disabled={isPending}
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        <Link href="/dashboard/creator">
          <Button variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  )
}
