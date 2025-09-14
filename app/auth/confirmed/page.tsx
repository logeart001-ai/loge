'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'

function ConfirmedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(next)
    }, 3000)

    return () => clearTimeout(timer)
  }, [router, next])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="absolute top-4 left-4">
        <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium">
          ← Back to Home
        </Link>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-green-600">Email Confirmed!</CardTitle>
          <CardDescription>
            Your account has been successfully verified
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Welcome to L&apos;oge Arts! You&apos;ll be redirected to your dashboard shortly.
          </p>
          <Link href={next}>
            <Button className="w-full bg-orange-500 hover:bg-orange-600">
              Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ConfirmedPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmedContent />
    </Suspense>
  )
}
