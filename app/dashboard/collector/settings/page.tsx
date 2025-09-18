import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from '@/components/profile-form'

async function getUserProfile(userId: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}

export default async function CollectorSettingsPage() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Update Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} profile={profile} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}