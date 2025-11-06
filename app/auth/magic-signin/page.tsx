'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sendMagicLink } from '@/lib/auth-magic-link'
import { GoogleSignInButton } from '@/components/google-signin-button'
import { Loader2, Mail, ArrowLeft, Sparkles } from 'lucide-react'

export default function MagicSignInPage() {
  const [state, action, isPending] = useActionState(sendMagicLink, null)
  const [email, setEmail] = useState('')

  if (state?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 to-red-50">
        <div className="absolute top-4 left-4">
          <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium">
            ← Back to Home
          </Link>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-brand-yellow" />
            </div>
            <CardTitle className="text-brand-yellow">Check Your Email!</CardTitle>
            <CardDescription>
              {state.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700 font-medium mb-2">
                We sent a magic link to:
              </p>
              <p className="text-orange-800 font-semibold">{state.email}</p>
            </div>
            <p className="text-gray-600 text-sm">
              Click the link in your email to sign in instantly. No password needed!
            </p>
            <p className="text-xs text-gray-500">
              Didn't receive it? Check your spam folder or try again.
            </p>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 to-red-50">
      <div className="absolute top-4 left-4">
        <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium">
          ← Back to Home
        </Link>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-semibold text-lg text-gray-900">L&apos;oge Arts</span>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <CardDescription>
            Sign in instantly with a magic link - no password required
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Google Sign In */}
            <div className="grid grid-cols-2 gap-3">
              <GoogleSignInButton userType="creator" variant="outline" className="w-full">
                <span className="text-xs">Creator</span>
              </GoogleSignInButton>
              <GoogleSignInButton userType="collector" variant="outline" className="w-full">
                <span className="text-xs">Collector</span>
              </GoogleSignInButton>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Magic Link Form */}
            <form action={action} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isPending}
                />
              </div>
              
              {state?.error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {state.error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600" 
                disabled={isPending || !email}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending magic link...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Magic Link
                  </>
                )}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <Link 
                href="/auth/signin" 
                className="inline-flex items-center text-sm text-gray-600 hover:text-orange-500"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Use password instead
              </Link>
              <div className="text-sm">
                <span className="text-gray-600">Don't have an account? </span>
                <Link href="/auth/signup" className="text-orange-500 hover:underline font-medium">
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}