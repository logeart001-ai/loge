'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, X, User, LogOut, ShoppingCart, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase-client'
import { useUserType } from '@/hooks/use-user-type'

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
  
  // Get the correct user type from database
  const { userType, loading: userTypeLoading } = useUserType(user)

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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-1 sm:space-x-2">
            <Image
              src="/image/logelogo.png"
              alt="L'oge Arts logo"
              width={48}
              height={48}
              className="sm:w-16 sm:h-16"
              priority
            />
            <span className="brand-text font-semibold text-base sm:text-lg text-gray-900 hidden xs:block">L&apos;oge Arts</span>
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
            <Link href="/blog" className="text-gray-700 hover:text-orange-500 font-medium">
              Blog
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-orange-500 font-medium">
              About
            </Link>
            <Link href="/support" className="text-gray-700 hover:text-orange-500 font-medium">
              Support
            </Link>
            <Link href="/search" className="text-gray-700 hover:text-orange-500 font-medium flex items-center space-x-1">
              <Search className="h-4 w-4" />
              <span>Search</span>
            </Link>
            {!loading && user && inDashboard && !userTypeLoading && (
              <Link
                href={userType === 'creator' ? '/dashboard/creator' : '/dashboard/collector'}
                className="text-orange-600 font-semibold"
              >
                Dashboard Home
              </Link>
            )}
          </div>

          {/* Mobile Cart & Menu */}
          <div className="flex items-center space-x-2 md:hidden">
            <Link href="/cart" className="relative flex items-center text-gray-700 hover:text-orange-500 p-2">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-4 text-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {loading ? (
              <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/blog/saved"
                  className="flex items-center space-x-2 text-gray-700 hover:text-orange-500"
                >
                  <span>Saved</span>
                </Link>
                {!userTypeLoading && (
                  <Link
                    href={userType === 'creator' ? '/dashboard/creator' : '/dashboard/collector'}
                    className="flex items-center space-x-2 text-gray-700 hover:text-orange-500"
                  >
                    <User className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                )}
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
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 shadow-sm">
                    Get Started
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
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-3 pt-3 pb-4 space-y-1 max-h-screen overflow-y-auto">
              {/* Main Navigation */}
              <div className="space-y-1">
                <Link
                  href="/"
                  className="flex items-center px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  🏠 Home
                </Link>
                <Link
                  href="/art"
                  className="flex items-center px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  🎨 Art
                </Link>
                <Link
                  href="/fashion"
                  className="flex items-center px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  👗 Fashion
                </Link>
                <Link
                  href="/books"
                  className="flex items-center px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  📚 Books
                </Link>
                <Link
                  href="/events"
                  className="flex items-center px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  🎪 Events
                </Link>
                <Link
                  href="/blog"
                  className="flex items-center px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  📝 Blog
                </Link>
                <Link
                  href="/search"
                  className="flex items-center px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Link>
              </div>

              {/* User Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                {loading ? (
                  <div className="px-4 py-3">
                    <div className="w-24 h-8 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                ) : user ? (
                  <div className="space-y-1">
                    <div className="px-4 py-2 text-sm text-gray-500">
                      Signed in as {user.user_metadata?.full_name || user.email}
                    </div>
                    <Link
                      href="/blog/saved"
                      className="flex items-center px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg font-medium transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      📖 Saved Articles
                    </Link>
                    {!userTypeLoading && (
                      <Link
                        href={userType === 'creator' ? '/dashboard/creator' : '/dashboard/collector'}
                        className="flex items-center px-4 py-3 text-gray-700 hover:text-orange-500 hover:bg-orange-50 rounded-lg font-medium transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    )}
                    {!loading && user && inDashboard && !userTypeLoading && (
                      <Link
                        href={userType === 'creator' ? '/dashboard/creator' : '/dashboard/collector'}
                        className="flex items-center px-4 py-3 text-orange-600 hover:bg-orange-50 rounded-lg font-semibold transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        🏠 Dashboard Home
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-3 text-gray-700 hover:text-red-500 hover:bg-red-50 rounded-lg font-medium transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/auth/signin" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-left h-12">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 h-12">
                        Get Started Free
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Secondary Links */}
              <div className="border-t border-gray-200 pt-4 mt-4 space-y-1">
                <Link
                  href="/about"
                  className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-orange-500 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/support"
                  className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-orange-500 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Support
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
