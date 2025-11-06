'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'

export function useUserType(user: any) {
  const [userType, setUserType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getUserType() {
      if (!user?.id) {
        setUserType(null)
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        // Check database first, then fall back to metadata
        const detectedType = profile?.role || user.user_metadata?.user_type || user.user_metadata?.role || 'collector'
        setUserType(detectedType)
      } catch (error) {
        console.error('Error fetching user type:', error)
        // Fallback to metadata or default
        const fallbackType = user.user_metadata?.user_type || user.user_metadata?.role || 'collector'
        setUserType(fallbackType)
      } finally {
        setLoading(false)
      }
    }

    getUserType()
  }, [user])

  return { userType, loading }
}