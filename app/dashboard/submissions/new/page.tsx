'use client'

import { useState, useEffect } from 'react'
import { ProjectSubmissionForm } from '@/components/creator/project-submission-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Palette, BookOpen, Shirt } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function NewSubmissionPage() {
  const [creatorType, setCreatorType] = useState<'artist' | 'writer' | 'fashion_designer' | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
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
        
        // Auto-detect creator type based on discipline
        if (profileData.discipline) {
          if (['painter', 'sculptor', 'digital_artist', 'mixed_media'].includes(profileData.discipline)) {
            setCreatorType('artist')
          } else if (['author', 'poet', 'journalist', 'writer'].includes(profileData.discipline)) {
            setCreatorType('writer')
          } else if (['fashion_designer', 'textile_designer', 'jewelry_designer'].includes(profileData.discipline)) {
            setCreatorType('fashion_designer')
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!creatorType) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Submission Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="creator_type">What type of work are you submitting?</Label>
              <Select onValueChange={(value) => setCreatorType(value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select submission type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="artist">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Artist (Paintings, Sculptures, Digital Art)
                    </div>
                  </SelectItem>
                  <SelectItem value="writer">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Writer & Author (Books, Poetry, Articles)
                    </div>
                  </SelectItem>
                  <SelectItem value="fashion_designer">
                    <div className="flex items-center gap-2">
                      <Shirt className="w-4 h-4" />
                      Fashion & Textile Designer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className="cursor-pointer hover:bg-orange-50 border-2 hover:border-orange-200"
                onClick={() => setCreatorType('artist')}
              >
                <CardContent className="p-6 text-center">
                  <Palette className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Artist</h3>
                  <p className="text-sm text-gray-600">Paintings, sculptures, digital art</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-orange-50 border-2 hover:border-orange-200"
                onClick={() => setCreatorType('writer')}
              >
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Writer & Author</h3>
                  <p className="text-sm text-gray-600">Books, poetry, articles</p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:bg-orange-50 border-2 hover:border-orange-200"
                onClick={() => setCreatorType('fashion_designer')}
              >
                <CardContent className="p-6 text-center">
                  <Shirt className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Fashion Designer</h3>
                  <p className="text-sm text-gray-600">Clothing, textiles, accessories</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <ProjectSubmissionForm creatorType={creatorType} />
}