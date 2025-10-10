import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await requireAuth()
  
  // Redirect to appropriate dashboard based on user type
  const userType = user.user_metadata?.user_type || user.user_metadata?.role
  
  if (userType === 'creator') {
    redirect('/dashboard/creator')
  } else if (userType === 'collector' || userType === 'buyer') {
    // Handle both 'collector' and 'buyer' as they mean the same thing
    redirect('/dashboard/collector')
  } else {
    // If no user type is set, redirect to onboarding
    redirect('/dashboard/onboarding')
  }
}