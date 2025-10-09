'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { signUp } from '@/lib/auth'
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react'
import { GoogleSignInButton } from '@/components/google-signin-button'

// Define the signup response type
type SignUpResponse = 
  | { success: true; message: string; redirectTo: string }
  | { error: string }
  | null

export default function SignUpPage() {
  const [state, action, isPending] = useActionState(signUp, null as SignUpResponse)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [userType, setUserType] = useState('')
  const router = useRouter()

  console.log('🎯 SIGNUP PAGE STATE:', JSON.stringify(state, null, 2))

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumbers: false,
    hasSpecialChar: false
  })

  // Email validation
  const [emailValid, setEmailValid] = useState(true)

  useEffect(() => {
    // Validate password in real-time
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    })
  }, [password])

  useEffect(() => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    setEmailValid(email === '' || emailRegex.test(email))
  }, [email])

  useEffect(() => {
    if (state && 'success' in state && state.success && 'redirectTo' in state) {
      const timer = setTimeout(() => {
        router.push(state.redirectTo)
      }, 2000)
      return () => clearTimeout(timer)
    }
    
    // Debug logging
    if (state) {
      console.log('Signup state:', state)
    }
  }, [state, router])

  if (state && 'success' in state && state.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-brand-yellow">Success!</CardTitle>
            <CardDescription>
              {state.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/auth/signin">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Go to Sign In
              </Button>
            </Link>
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
          <CardTitle className="text-2xl font-bold">Join L&apos;oge Arts</CardTitle>
          <CardDescription>
            Create your account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <GoogleSignInButton userType="creator" variant="outline" className="w-full">
              <span className="text-xs">Creator</span>
            </GoogleSignInButton>
            <GoogleSignInButton userType="collector" variant="outline" className="w-full">
              <span className="text-xs">Collector</span>
            </GoogleSignInButton>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          <form action={action} className="space-y-4" onSubmit={(e) => {
            console.log('🚀 Form submission started');
            // Check if all required fields are filled
            const formData = new FormData(e.currentTarget);
            console.log('Form data entries:');
            for (const [key, value] of formData.entries()) {
              console.log(key, value);
            }
          }}>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isPending}
                className={fullName.trim().length > 0 && fullName.trim().length < 2 ? 'border-red-300' : ''}
              />
              {fullName.trim().length > 0 && fullName.trim().length < 2 && (
                <p className="text-sm text-red-600">Full name must be at least 2 characters</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending}
                className={!emailValid ? 'border-red-300' : ''}
              />
              {!emailValid && (
                <p className="text-sm text-red-600">Please enter a valid email address</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              
              {password && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
                  <div className="space-y-1">
                    {[
                      { key: 'minLength', label: 'At least 8 characters' },
                      { key: 'hasUpperCase', label: 'One uppercase letter' },
                      { key: 'hasLowerCase', label: 'One lowercase letter' },
                      { key: 'hasNumbers', label: 'One number' },
                      { key: 'hasSpecialChar', label: 'One special character' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center space-x-2">
                        {passwordValidation[key as keyof typeof passwordValidation] ? (
                          <Check className="h-4 w-4 text-brand-yellow" />
                        ) : (
                          <X className="h-4 w-4 text-brand-red" />
                        )}
                        <span className={`text-sm ${
                          passwordValidation[key as keyof typeof passwordValidation] 
                            ? 'text-brand-yellow' 
                            : 'text-brand-red'
                        }`}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="userType">I am a...</Label>
              <Select name="userType" required disabled={isPending} value={userType} onValueChange={setUserType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collector">Art Enthusiast/Collector</SelectItem>
                  <SelectItem value="creator">Artist/Creator</SelectItem>
                </SelectContent>
              </Select>
              {/* Hidden input to ensure userType is included in form data */}
              <input type="hidden" name="userType" value={userType} />
            </div>
            {state && 'error' in state && state.error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {state.error}
              </div>
            )}
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link href="/auth/signin" className="text-orange-500 hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
