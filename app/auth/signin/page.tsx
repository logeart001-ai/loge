'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signIn, resendConfirmation } from '@/lib/auth'
import { Loader2, Mail } from 'lucide-react'

export default function SignInPage() {
  const [state, action, isPending] = useActionState(signIn, null)
  const [resendState, resendAction, isResending] = useActionState(resendConfirmation, null)
  const [showResendForm, setShowResendForm] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (state?.success && state?.redirectTo) {
      const timer = setTimeout(() => {
        router.push(state.redirectTo)
      }, 2000)
      return () => clearTimeout(timer)
    }
    
    // Show resend form if email not confirmed
    if (state?.error && state.error.toLowerCase().includes('email not confirmed')) {
      setShowResendForm(true)
    }
  }, [state, router])

  if (state?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="absolute top-4 left-4">
          <Link href="/" className="text-orange-600 hover:text-orange-700 font-medium">
            ← Back to Home
          </Link>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">Success!</CardTitle>
            <CardDescription>
              {state.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirecting...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
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
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your L&apos;oge Arts account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showResendForm ? (
            <form action={action} className="space-y-4">
              <input type="hidden" name="redirectTo" value={searchParams.get('redirectTo') || ''} />
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  disabled={isPending}
                  onChange={(e) => setUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-orange-500 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  disabled={isPending}
                />
              </div>
              {state?.error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {state.error}
                </div>
              )}
              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Resend Confirmation Email</h3>
                <form action={resendAction} className="space-y-3">
                  <Input
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    defaultValue={userEmail}
                    required
                    disabled={isResending}
                  />
                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isResending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Email'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowResendForm(false)}
                    >
                      Back to Sign In
                    </Button>
                  </div>
                </form>
                {resendState?.success && (
                  <div className="mt-2 text-green-600 text-sm">
                    {resendState.message}
                  </div>
                )}
                {resendState?.error && (
                  <div className="mt-2 text-red-600 text-sm">
                    {resendState.error}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don&apos;t have an account? </span>
            <Link href="/auth/signup" className="text-orange-500 hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
