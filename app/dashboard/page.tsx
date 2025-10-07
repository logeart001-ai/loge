import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await requireAuth()
  
  // Redirect to appropriate dashboard based on user type
  const userType = user.user_metadata?.user_type
  
  if (userType === 'creator') {
    redirect('/dashboard/creator')
  } else if (userType === 'collector') {
    redirect('/dashboard/collector')
  } else {
    // If no user type is set, redirect to onboarding
    redirect('/dashboard/onboarding')
  }
}