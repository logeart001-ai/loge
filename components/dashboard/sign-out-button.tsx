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
    setIsSigningOut(true)
    
    try {
      // Prefer server-side signout to ensure cookies cleared in SSR contexts
      const res = await fetch('/auth/signout', { method: 'POST' })
      
      if (!res.ok) {
        // Fallback to client signout if server route fails
        const supabase = createClient()
        await supabase.auth.signOut()
      }
    } catch {
      const supabase = createClient()
      await supabase.auth.signOut()
    } finally {
      // Always navigate to landing or signin after signout
      const inDash = pathname?.startsWith('/dashboard')
      router.push(inDash ? '/auth/signin' : '/')
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