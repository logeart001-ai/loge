import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { NotificationCenter } from '@/components/notification-center'

type UserType = 'creator' | 'collector'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const userType = (typeof meta.user_type === 'string' ? meta.user_type : undefined) as UserType | undefined
  const homeHref = userType === 'creator' ? '/dashboard/creator' : '/dashboard/collector'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          {/* Mobile Layout */}
          <div className="flex items-center justify-between sm:hidden">
            <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center">
              ← Home
            </Link>
            <div className="flex items-center gap-2">
              <NotificationCenter userId={user.id} />
              <Link href={homeHref}>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 text-xs">
                  Home
                </Button>
              </Link>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium text-sm">
                ← Home
              </Link>
              <div className="text-sm text-gray-600">Dashboard</div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationCenter userId={user.id} />
              <Link href={homeHref}>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                  Dashboard Home
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Dashboard Title */}
          <div className="sm:hidden mt-2 pb-1">
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          </div>
        </div>
      </div>
      <div className="px-3 sm:px-0">{children}</div>
    </div>
  )
}
