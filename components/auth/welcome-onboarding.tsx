'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Palette, ShoppingBag, Users, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface WelcomeOnboardingProps {
  userName: string
  userType?: 'creator' | 'collector' | 'buyer'
  onComplete?: () => void
}

export function WelcomeOnboarding({ userName, userType, onComplete }: WelcomeOnboardingProps) {
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<'creator' | 'collector'>(
    userType === 'creator' ? 'creator' : 'collector'
  )

  const handleComplete = () => {
    onComplete?.()
  }

  const getNextSteps = () => {
    if (selectedType === 'creator') {
      return [
        { title: 'Complete your profile', href: '/dashboard/creator/profile', icon: Users },
        { title: 'Upload your first artwork', href: '/dashboard/creator/artworks/new', icon: Palette },
        { title: 'Explore the marketplace', href: '/art', icon: ShoppingBag }
      ]
    } else {
      return [
        { title: 'Explore artworks', href: '/art', icon: Palette },
        { title: 'Follow your favorite artists', href: '/creators', icon: Users },
        { title: 'Start your collection', href: '/collections', icon: ShoppingBag }
      ]
    }
  }

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 to-red-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Welcome to L'oge Arts, {userName}! 🎉</CardTitle>
            <CardDescription className="text-lg">
              Let's personalize your experience to help you get the most out of our platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-6">What brings you to L'oge Arts?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedType === 'creator' ? 'ring-2 ring-orange-500 bg-orange-50' : ''
                  }`}
                  onClick={() => setSelectedType('creator')}
                >
                  <CardContent className="p-6 text-center">
                    <Palette className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                    <h3 className="font-semibold mb-2">I'm an Artist/Creator</h3>
                    <p className="text-sm text-gray-600">
                      I want to showcase and sell my artwork, connect with collectors, and build my artistic career.
                    </p>
                    <Badge variant="secondary" className="mt-3">
                      Create & Sell
                    </Badge>
                  </CardContent>
                </Card>
                
                <Card 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedType === 'collector' ? 'ring-2 ring-orange-500 bg-orange-50' : ''
                  }`}
                  onClick={() => setSelectedType('collector')}
                >
                  <CardContent className="p-6 text-center">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                    <h3 className="font-semibold mb-2">I'm an Art Enthusiast</h3>
                    <p className="text-sm text-gray-600">
                      I want to discover amazing art, support artists, and build my collection.
                    </p>
                    <Badge variant="secondary" className="mt-3">
                      Discover & Collect
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={() => setStep(2)}
                className="bg-orange-500 hover:bg-orange-600 px-8"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const nextSteps = getNextSteps()

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 to-red-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">You're all set! 🚀</CardTitle>
          <CardDescription className="text-lg">
            Here are some great ways to get started as {selectedType === 'creator' ? 'an artist' : 'a collector'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {nextSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <Link key={index} href={step.href}>
                  <Card className="cursor-pointer hover:shadow-md transition-all hover:bg-orange-50">
                    <CardContent className="p-4 flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Icon className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{step.title}</h3>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
          
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600 mb-4">
              Don't worry, you can always change your preferences later in your profile settings.
            </p>
            <Button 
              onClick={handleComplete}
              variant="outline"
              className="mr-3"
            >
              Skip for now
            </Button>
            <Link href={selectedType === 'creator' ? '/dashboard/creator' : '/dashboard/collector'}>
              <Button className="bg-orange-500 hover:bg-orange-600">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}