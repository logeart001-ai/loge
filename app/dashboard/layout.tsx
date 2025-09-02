import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

type UserType = 'creator' | 'buyer'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const userType = (typeof meta.user_type === 'string' ? meta.user_type : undefined) as UserType | undefined
  const homeHref = userType === 'creator' ? '/dashboard/creator' : '/dashboard/buyer'

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="text-sm text-gray-600">Dashboard</div>
          <Link href={homeHref}>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
              Dashboard Home
            </Button>
          </Link>
        </div>
      </div>
      <div>{children}</div>
    </div>
  )
}
