'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X, User, LogOut, ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  type UserMetadata = {
    user_type?: 'creator' | 'collector'
    full_name?: string
    avatar_url?: string
    [key: string]: unknown
  }
  type MinimalUser = { id: string; email?: string | null; user_metadata?: UserMetadata }
  const [user, setUser] = useState<MinimalUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState<number>(0)
  const router = useRouter()
  const pathname = usePathname()
  const inDashboard = pathname?.startsWith('/dashboard')

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
        if (session?.user) {
          // refresh cart count on auth changes
          fetch('/api/cart', { credentials: 'include' })
            .then(r => r.ok ? r.json() : { count: 0 })
            .then((d) => setCartCount(Number(d?.count ?? 0)))
            .catch(() => setCartCount(0))
        } else {
          setCartCount(0)
        }
      }
    )

    // Initial cart count attempt
    fetch('/api/cart', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { count: 0 })
      .then((d) => setCartCount(Number(d?.count ?? 0)))
      .catch(() => {})

    // Listen to cart updates
    const onCartUpdated = () => {
      fetch('/api/cart', { credentials: 'include' })
        .then(r => r.ok ? r.json() : { count: 0 })
        .then((d) => setCartCount(Number(d?.count ?? 0)))
        .catch(() => {})
    }
    window.addEventListener('cart:updated', onCartUpdated)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('cart:updated', onCartUpdated)
    }
  }, [])

  // Removed scroll-based background transitioning per request

  const handleSignOut = async () => {
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
    }
  }

  return (
    <nav
      className="border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md bg-white/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/image/logelogo.png"
              alt="L'oge Arts logo"
              width={64}
              height={64}
              priority
            />
            <span className="brand-text font-semibold text-lg text-gray-900">L&apos;oge Arts</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-orange-500 font-medium">
              Home
            </Link>
            <Link href="/art" className="text-gray-700 hover:text-orange-500 font-medium">
              Art
            </Link>
            <Link href="/fashion" className="text-gray-700 hover:text-orange-500 font-medium">
              Fashion
            </Link>
            <Link href="/books" className="text-gray-700 hover:text-orange-500 font-medium">
              Books
            </Link>
            <Link href="/events" className="text-gray-700 hover:text-orange-500 font-medium">
              Events
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-orange-500 font-medium">
              About
            </Link>
            <Link href="/support" className="text-gray-700 hover:text-orange-500 font-medium">
              Support
            </Link>
            {!loading && user && inDashboard && (
              <Link
                href={user.user_metadata?.user_type === 'creator' ? '/dashboard/creator' : '/dashboard/collector'}
                className="text-orange-600 font-semibold"
              >
                Dashboard Home
              </Link>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {loading ? (
              <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href={user.user_metadata?.user_type === 'creator' ? '/dashboard/creator' : '/dashboard/collector'}
                  className="flex items-center space-x-2 text-gray-700 hover:text-orange-500"
                >
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
                <Link href="/cart" className="relative flex items-center text-gray-700 hover:text-orange-500">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-gray-700 hover:text-orange-500">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6">
                    Join
                  </Button>
                </Link>
                <Link href="/cart" className="relative flex items-center text-gray-700 hover:text-orange-500">
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-100">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/"
                className="block px-3 py-2 text-gray-700 hover:text-orange-500 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/art"
                className="block px-3 py-2 text-gray-700 hover:text-orange-500 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Art
              </Link>
              <Link
                href="/fashion"
                className="block px-3 py-2 text-gray-700 hover:text-orange-500 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Fashion
              </Link>
              <Link
                href="/books"
                className="block px-3 py-2 text-gray-700 hover:text-orange-500 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Books
              </Link>
              <Link
                href="/events"
                className="block px-3 py-2 text-gray-700 hover:text-orange-500 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Events
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-gray-700 hover:text-orange-500 font-medium"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                href="/support"
                className="block px-3 py-2 text-gray-700 hover:text-orange-500 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Support
              </Link>
              <Link
                href="/cart"
                className="block px-3 py-2 text-gray-700 hover:text-orange-500 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Cart {cartCount > 0 ? `(${cartCount})` : ''}
              </Link>
              {!loading && user && inDashboard && (
                <Link
                  href={user.user_metadata?.user_type === 'creator' ? '/dashboard/creator' : '/dashboard/collector'}
                  className="block px-3 py-2 text-orange-600 font-semibold"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard Home
                </Link>
              )}
              
              <div className="border-t pt-4 space-y-2">
                {loading ? (
                  <div className="px-3 py-2">
                    <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                ) : user ? (
                  <div className="space-y-2">
                    <Link
                      href={user.user_metadata?.user_type === 'creator' ? '/dashboard/creator' : '/dashboard/collector'}
                      className="block px-3 py-2 text-gray-700 hover:text-orange-500 font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsOpen(false)
                      }}
                      className="block w-full text-left px-3 py-2 text-gray-700 hover:text-orange-500 font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <>
                    <Link href="/auth/signin">
                      <Button variant="ghost" className="w-full justify-start" onClick={() => setIsOpen(false)}>
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => setIsOpen(false)}>
                        Join
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
