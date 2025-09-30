'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, User, Palette, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface CreatorProfile {
  id: string
  full_name: string
  email: string
  role: string
  art_name?: string
  pen_name?: string
  brand_name?: string
  artist_statement?: string
  portfolio_links?: any
  whatsapp_phone?: string
  billing_address?: any
  discipline?: string
  onboarding_completed: boolean
}

export function CreatorOnboarding() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    art_name: '',
    pen_name: '',
    brand_name: '',
    artist_statement: '',
    discipline: '',
    whatsapp_phone: '',
    portfolio_links: {
      instagram: '',
      behance: '',
      website: '',
      other: ''
    },
    billing_address: {
      street: '',
      city: '',
      state: '',
      country: 'Nigeria',
      postal_code: ''
    }
  })

  const supabase = createClient()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFormData({
          art_name: profileData.art_name || '',
          pen_name: profileData.pen_name || '',
          brand_name: profileData.brand_name || '',
          artist_statement: profileData.artist_statement || '',
          discipline: profileData.discipline || '',
          whatsapp_phone: profileData.whatsapp_phone || '',
          portfolio_links: profileData.portfolio_links || {
            instagram: '',
            behance: '',
            website: '',
            other: ''
          },
          billing_address: profileData.billing_address || {
            street: '',
            city: '',
            state: '',
            country: 'Nigeria',
            postal_code: ''
          }
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          art_name: formData.art_name,
          pen_name: formData.pen_name,
          brand_name: formData.brand_name,
          artist_statement: formData.artist_statement,
          discipline: formData.discipline,
          whatsapp_phone: formData.whatsapp_phone,
          portfolio_links: formData.portfolio_links,
          billing_address: formData.billing_address
        })
        .eq('id', profile.id)

      if (error) throw error

      await fetchUserData()
      alert('Profile saved successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p>Please log in to access the creator dashboard.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Creator Profile Setup
        </h1>
        <p className="text-gray-600">
          Complete your profile to start sharing your creative work
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Creator Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="art_name">Art Name / Alias</Label>
              <Input
                id="art_name"
                value={formData.art_name}
                onChange={(e) => setFormData(prev => ({ ...prev, art_name: e.target.value }))}
                placeholder="Your artistic name"
              />
            </div>
            <div>
              <Label htmlFor="pen_name">Pen Name</Label>
              <Input
                id="pen_name"
                value={formData.pen_name}
                onChange={(e) => setFormData(prev => ({ ...prev, pen_name: e.target.value }))}
                placeholder="Your writing name"
              />
            </div>
            <div>
              <Label htmlFor="brand_name">Brand Name</Label>
              <Input
                id="brand_name"
                value={formData.brand_name}
                onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                placeholder="Your fashion brand"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="discipline">Creative Discipline</Label>
            <Select
              value={formData.discipline}
              onValueChange={(value) => setFormData(prev => ({ ...prev, discipline: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your primary discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="painter">Painter</SelectItem>
                <SelectItem value="sculptor">Sculptor</SelectItem>
                <SelectItem value="digital_artist">Digital Artist</SelectItem>
                <SelectItem value="author">Author</SelectItem>
                <SelectItem value="poet">Poet</SelectItem>
                <SelectItem value="writer">Writer</SelectItem>
                <SelectItem value="fashion_designer">Fashion Designer</SelectItem>
                <SelectItem value="textile_designer">Textile Designer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="artist_statement">
              Creator Statement (300-500 words)
            </Label>
            <Textarea
              id="artist_statement"
              value={formData.artist_statement}
              onChange={(e) => setFormData(prev => ({ ...prev, artist_statement: e.target.value }))}
              placeholder="What story are you telling through your work?"
              rows={6}
              maxLength={500}
            />
            <div className="text-sm text-gray-500 mt-1">
              {formData.artist_statement.length}/500 characters
            </div>
          </div>

          <div>
            <Label htmlFor="whatsapp_phone">WhatsApp Phone</Label>
            <Input
              id="whatsapp_phone"
              value={formData.whatsapp_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_phone: e.target.value }))}
              placeholder="+234..."
            />
          </div>

          <div>
            <Label>Portfolio Links</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="instagram" className="text-sm">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.portfolio_links.instagram}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    portfolio_links: { ...prev.portfolio_links, instagram: e.target.value }
                  }))}
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>
              <div>
                <Label htmlFor="website" className="text-sm">Website</Label>
                <Input
                  id="website"
                  value={formData.portfolio_links.website}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    portfolio_links: { ...prev.portfolio_links, website: e.target.value }
                  }))}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={saveProfile}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}