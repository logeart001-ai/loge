import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

interface FollowingRow {
  following_id: string
  created_at: string
  creator?: {
    id: string
    full_name: string
    avatar_url?: string | null
    location?: string | null
    discipline?: string | null
  } | null
}

async function getFollowing(userId: string) {
  const supabase = await createServerClient()
  // Prefer plural 'follows' but fall back to 'following'
  const { data: dataPlural, error: errorPlural } = await supabase
    .from('follows')
    .select(`
      following_id,
      created_at
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })

  if (!errorPlural && dataPlural) {
    return dataPlural as unknown as FollowingRow[]
  }

  const { data: dataSingular, error: errorSingular } = await supabase
    .from('following')
    .select(`
      following_id,
      created_at
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })

  if (errorSingular) {
    console.error('Error fetching following:', errorSingular)
    return [] as FollowingRow[]
  }
  return (dataSingular as unknown as FollowingRow[]) || []
}

export default async function CollectorFollowingPage() {
  const user = await requireAuth()
  const rows = await getFollowing(user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-semibold">Following</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Creators You Follow</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="text-center py-12 text-gray-500">You are not following anyone yet.</div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rows.map((row) => (
                  <div key={row.following_id} className="border rounded-lg bg-white p-4 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={'/placeholder.svg'}
                        alt={row.following_id}
                        width={56}
                        height={56}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Creator {row.following_id.slice(0, 8)}</div>
                      <div className="text-sm text-gray-600">
                        Followed on {new Date(row.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Link href={`/creator/${row.following_id}`} className="text-orange-600 text-sm font-medium">View</Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}