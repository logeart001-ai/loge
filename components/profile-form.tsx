'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateUserProfile } from '@/lib/auth'
import { Loader2 } from 'lucide-react'

interface ProfileFormProps {
  user: any
  profile: any
}

export function ProfileForm({ user, profile }: ProfileFormProps) {
  const [state, action, isPending] = useActionState(updateUserProfile, null)

  return (
    <form action={action} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={profile?.full_name || user.user_metadata?.full_name || ''}
            placeholder="Your full name"
            required
            disabled={isPending}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={profile?.location || ''}
            placeholder="City, Country"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="discipline">Artistic Discipline</Label>
        <Input
          id="discipline"
          name="discipline"
          defaultValue={profile?.discipline || ''}
          placeholder="e.g., Visual Arts, Sculpture, Fashion Design"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={profile?.bio || ''}
          placeholder="Tell us about yourself and your artistic journey..."
          rows={4}
          disabled={isPending}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Social Links</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              name="instagram"
              defaultValue={profile?.social_links?.instagram || ''}
              placeholder="@username"
              disabled={isPending}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="twitter">Twitter</Label>
            <Input
              id="twitter"
              name="twitter"
              defaultValue={profile?.social_links?.twitter || ''}
              placeholder="@username"
              disabled={isPending}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              defaultValue={profile?.social_links?.website || ''}
              placeholder="https://yourwebsite.com"
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {state?.error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="text-brand-yellow text-sm bg-brand-yellow/10 p-3 rounded-md">
          {state.message}
        </div>
      )}

      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating Profile...
          </>
        ) : (
          'Update Profile'
        )}
      </Button>
    </form>
  )
}