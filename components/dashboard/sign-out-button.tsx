'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

interface SignOutButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function SignOutButton({ variant = 'outline', size = 'sm', className }: SignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    console.log('🔥 Sign out button clicked')
    setIsSigningOut(true)
    
    try {
      console.log('🔥 Attempting server-side signout...')
      // Prefer server-side signout to ensure cookies cleared in SSR contexts
      const res = await fetch('/auth/signout', { method: 'POST' })
      console.log('🔥 Server signout response:', res.status, res.ok)
      
      if (!res.ok) {
        console.log('🔥 Server signout failed, trying client signout...')
        // Fallback to client signout if server route fails
        const supabase = createClient()
        const { error } = await supabase.auth.signOut()
        console.log('🔥 Client signout result:', error ? `Error: ${error.message}` : 'Success')
      } else {
        console.log('🔥 Server signout successful')
      }
    } catch (error) {
      console.log('🔥 Sign out error, trying final fallback:', error)
      const supabase = createClient()
      const { error: fallbackError } = await supabase.auth.signOut()
      console.log('🔥 Fallback signout result:', fallbackError ? `Error: ${fallbackError.message}` : 'Success')
    } finally {
      // Always navigate to landing or signin after signout
      const inDash = pathname?.startsWith('/dashboard')
      const redirectPath = inDash ? '/auth/signin' : '/'
      console.log('🔥 Redirecting to:', redirectPath)
      
      // Use window.location.href for a hard redirect to ensure session is cleared
      setTimeout(() => {
        window.location.href = redirectPath
      }, 100)
      
      setIsSigningOut(false)
    }
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={className}
    >
      {isSigningOut ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Signing out...
        </>
      ) : (
        <>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </>
      )}
    </Button>
  )
}