'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight, Sparkles, Users, Palette } from 'lucide-react'
import Link from 'next/link'
import { QuickSignupModal } from './quick-signup-modal'

interface LandingCTAProps {
  className?: string
}

export function LandingCTA({ className = '' }: LandingCTAProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main CTA */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-12 h-12" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Join L'oge Arts?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Connect with artists, discover amazing art, and be part of our creative community
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <QuickSignupModal 
              trigger={
                <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 px-8">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              }
              onSuccess={() => setShowModal(false)}
            />
            <Link href="/auth/magic-signin">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white hover:text-orange-600 px-8"
              >
                ✨ Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/auth/signup?type=creator">
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6 text-center">
              <Palette className="w-10 h-10 text-orange-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-2">I'm an Artist</h3>
              <p className="text-sm text-gray-600 mb-4">
                Showcase and sell your artwork to collectors worldwide
              </p>
              <Button variant="outline" className="w-full group-hover:bg-orange-50">
                Join as Creator
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/auth/signup?type=collector">
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6 text-center">
              <Users className="w-10 h-10 text-orange-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-2">I'm an Art Lover</h3>
              <p className="text-sm text-gray-600 mb-4">
                Discover amazing art and support talented artists
              </p>
              <Button variant="outline" className="w-full group-hover:bg-orange-50">
                Join as Collector
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Trust Indicators */}
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 mb-2">
          Join thousands of artists and collectors
        </p>
        <div className="flex justify-center items-center space-x-6 text-xs text-gray-400">
          <span>✓ Free to join</span>
          <span>✓ No hidden fees</span>
          <span>✓ Secure payments</span>
          <span>✓ Global community</span>
        </div>
      </div>
    </div>
  )
}