'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { GoogleSignInButton } from '@/components/google-signin-button'
import { Loader2, Mail, User } from 'lucide-react'
import { signUp } from '@/lib/auth'

interface QuickSignupModalProps {
  trigger?: React.ReactNode
  defaultUserType?: 'creator' | 'collector'
  onSuccess?: () => void
}

export function QuickSignupModal({ 
  trigger, 
  defaultUserType = 'collector',
  onSuccess 
}: QuickSignupModalProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'method' | 'email' | 'success'>('method')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', generateTempPassword())
      formData.append('fullName', name)
      formData.append('userType', defaultUserType)

      const result = await signUp(null, formData)
      
      if (result && 'error' in result) {
        setError(result.error)
      } else {
        setStep('success')
        setTimeout(() => {
          setOpen(false)
          onSuccess?.()
        }, 2000)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const generateTempPassword = () => {
    // Generate a secure temporary password
    return Math.random().toString(36).slice(-12) + 'A1!'
  }

  const resetModal = () => {
    setStep('method')
    setError('')
    setEmail('')
    setName('')
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) resetModal()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-orange-500 hover:bg-orange-600">
            Get Started
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === 'method' && (
          <>
            <DialogHeader>
              <DialogTitle>Join L'oge Arts</DialogTitle>
              <DialogDescription>
                Choose how you'd like to get started
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <GoogleSignInButton 
                  userType={defaultUserType} 
                  variant="outline" 
                  className="w-full"
                >
                  <span className="text-sm">Google</span>
                </GoogleSignInButton>
                <Button 
                  variant="outline" 
                  onClick={() => setStep('email')}
                  className="w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </>
        )}

        {step === 'email' && (
          <>
            <DialogHeader>
              <DialogTitle>Create Your Account</DialogTitle>
              <DialogDescription>
                We'll send you a magic link to get started
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('method')}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !email || !name}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </form>
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">Check Your Email!</DialogTitle>
              <DialogDescription className="text-center">
                We've sent a magic link to {email}
              </DialogDescription>
            </DialogHeader>
            <div className="text-center py-4">
              <Mail className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">
                Click the link in your email to complete your account setup.
              </p>
              <p className="text-xs text-gray-500">
                Didn't receive it? Check your spam folder or try again.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}