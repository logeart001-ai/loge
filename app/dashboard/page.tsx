import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase'

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = await createServerClient()
  
  // Try to get user role from database first, fallback to metadata
  let userRole = null
  
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    userRole = profile?.role
  } catch {
    console.log('Could not fetch user profile, using metadata fallback')
  }
  
  // Fallback to user metadata if database query fails
  if (!userRole) {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>
    userRole = meta.user_type || meta.role || 'buyer'
  }
  
  // Redirect to role-specific dashboard
  if (userRole === 'creator') {
    redirect('/dashboard/creator')
  } else {
    // Both 'buyer' and 'collector' go to collector dashboard
    redirect('/dashboard/collector')
  }
}