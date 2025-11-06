'use client'

import { useActionState, useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signIn, resendConfirmation } from '@/lib/auth'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { GoogleSignInButton } from '@/components/google-signin-button'
import { AuthErrorHandler } from '@/components/auth/auth-error-handler'

function SignInForm() {
  const [state, action, isPending] = useActionState(signIn, null)
  const [resendState, resendAction, isResending] = useActionState(resendConfirmation, null)
  const [showResendForm, setShowResendForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  // Debug: Log when component mounts
  useEffect(() => {
    console.log('🔥 SignInForm mounted')
  }, [])

  useEffect(() => {
    console.log('🔥 SignIn useEffect triggered', { 
      state, 
      hasState: !!state,
      stateSuccess: state?.success,
      stateRedirectTo: state?.redirectTo,
      stateError: state?.error,
      isPending,
      stateType: typeof state,
      stateKeys: state ? Object.keys(state) : []
    })
    
    if (state?.success) {
      console.log('🔥 Success detected! Redirecting to:', state?.redirectTo || '/dashboard')
      const redirectPath = state?.redirectTo || '/dashboard'
      
      // Small delay to ensure cookies are set before redirect
      console.log('🔥 Waiting for cookies to be set...')
      setTimeout(() => {
        console.log('🔥 Executing full page redirect to:', redirectPath)
        window.location.href = redirectPath
      }, 100)
      return
    } else if (state?.error) {
      console.log('🔥 Error detected:', state.error)
    } else if (state === null) {
      console.log('🔥 State is null (initial state)')
    } else {
      console.log('🔥 Unknown state:', state)
    }
    
    // Show resend form if email not confirmed
    if (state?.error && state.error.toLowerCase().includes('email not confirmed')) {
      setShowResendForm(true)
    }
  }, [state, router, isPending])

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
            <CardTitle className="text-brand-yellow">Success!</CardTitle>
            <CardDescription>
              {state.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirecting...</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              If you are not redirected automatically, click the button below:
            </p>
            <Button 
              onClick={() => {
                const redirectPath = state?.redirectTo || '/dashboard'
                console.log('🔥 Manual redirect to:', redirectPath)
                window.location.href = redirectPath
              }}
              className="w-full"
            >
              Go to Dashboard
            </Button>
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
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your L&apos;oge Arts account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showResendForm ? (
            <form action={action} className="space-y-4" onSubmit={(e) => {
              console.log('🔥 Form submitted!', {
                email: e.currentTarget.email.value,
                hasPassword: !!e.currentTarget.password.value,
                redirectTo: searchParams.get('redirectTo') || ''
              })
            }}>
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
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    required
                    disabled={isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 h-full px-3 flex items-center justify-center hover:bg-gray-100 rounded-r-md transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPending}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                    )}
                  </button>
                </div>
              </div>
              {state?.error && (
                <AuthErrorHandler 
                  error={state.error}
                  showMagicLinkOption={true}
                  userEmail={userEmail}
                  onRetry={() => window.location.reload()}
                />
              )}
              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600" 
                disabled={isPending}
                onClick={() => console.log('🔥 Sign In button clicked!', { isPending })}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <GoogleSignInButton userType="creator" variant="outline">
                    <span className="text-xs">Creator</span>
                  </GoogleSignInButton>
                  <GoogleSignInButton userType="collector" variant="outline">
                    <span className="text-xs">Collector</span>
                  </GoogleSignInButton>
                </div>
                <Link href="/auth/magic-signin">
                  <Button variant="outline" className="w-full">
                    <span className="text-sm">🔗 Sign in with Email Link</span>
                  </Button>
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-brand-orange/10 p-4 rounded-md border border-brand-orange/20">
                <h3 className="font-medium text-brand-orange mb-2">Resend Confirmation Email</h3>
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
                      className="bg-brand-orange hover:bg-brand-red"
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
                  <div className="mt-2 text-brand-yellow text-sm">
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

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 to-red-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
