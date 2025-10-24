'use client'

import { useActionState, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { updatePassword } from '@/lib/auth'
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react'

export default function ResetPasswordPage() {
  const [state, action, isPending] = useActionState(updatePassword, null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const router = useRouter()

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumbers: false,
    hasSpecialChar: false
  })

  const [passwordsMatch, setPasswordsMatch] = useState(true)

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
    // Check if passwords match
    setPasswordsMatch(confirmPassword === '' || password === confirmPassword)
  }, [password, confirmPassword])

  useEffect(() => {
    if (state?.success && state?.redirectTo) {
      const timer = setTimeout(() => {
        router.push(state.redirectTo)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [state, router])

  if (state?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 to-emerald-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-brand-yellow">Password Updated!</CardTitle>
            <CardDescription>
              {state.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirecting to dashboard...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isFormValid = Object.values(passwordValidation).every(Boolean) && passwordsMatch && password && confirmPassword

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
          <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
          <CardDescription>
            Choose a strong password for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
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
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isPending}
                  className={`pr-10 ${!passwordsMatch ? 'border-red-300' : ''}`}
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full px-3 flex items-center justify-center hover:bg-gray-100 rounded-r-md transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isPending}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                  )}
                </button>
              </div>
              {!passwordsMatch && confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}
            </div>
            
            {state?.error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {state.error}
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600" 
              disabled={isPending || !isFormValid}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}