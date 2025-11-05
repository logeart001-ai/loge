'use client'

import { AlertCircle, RefreshCw, Mail, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface AuthErrorHandlerProps {
  error: string
  onRetry?: () => void
  showMagicLinkOption?: boolean
  userEmail?: string
}

export function AuthErrorHandler({ 
  error, 
  onRetry, 
  showMagicLinkOption = false,
  userEmail 
}: AuthErrorHandlerProps) {
  const getErrorInfo = (errorMessage: string) => {
    const lowerError = errorMessage.toLowerCase()
    
    if (lowerError.includes('invalid login credentials') || lowerError.includes('invalid email or password')) {
      return {
        title: 'Sign In Failed',
        description: 'The email or password you entered is incorrect.',
        suggestions: [
          'Double-check your email address and password',
          'Try using the "Forgot Password" link to reset your password',
          'Use the Magic Link option for password-free sign in'
        ],
        icon: Key,
        color: 'red'
      }
    }
    
    if (lowerError.includes('email not confirmed')) {
      return {
        title: 'Email Not Verified',
        description: 'Please check your email and click the verification link.',
        suggestions: [
          'Check your email inbox and spam folder',
          'Click the verification link in the email',
          'Request a new verification email if needed'
        ],
        icon: Mail,
        color: 'yellow'
      }
    }
    
    if (lowerError.includes('too many requests') || lowerError.includes('rate limit')) {
      return {
        title: 'Too Many Attempts',
        description: 'Please wait a moment before trying again.',
        suggestions: [
          'Wait a few minutes before attempting to sign in again',
          'Try using the Magic Link option instead',
          'Contact support if the issue persists'
        ],
        icon: AlertCircle,
        color: 'orange'
      }
    }
    
    if (lowerError.includes('network') || lowerError.includes('fetch')) {
      return {
        title: 'Connection Issue',
        description: 'There seems to be a network problem.',
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Try again in a few moments'
        ],
        icon: RefreshCw,
        color: 'blue'
      }
    }
    
    // Default error
    return {
      title: 'Something Went Wrong',
      description: errorMessage,
      suggestions: [
        'Try refreshing the page and signing in again',
        'Clear your browser cache and cookies',
        'Contact support if the problem continues'
      ],
      icon: AlertCircle,
      color: 'red'
    }
  }

  const errorInfo = getErrorInfo(error)
  const Icon = errorInfo.icon

  const colorClasses = {
    red: 'border-red-200 bg-red-50 text-red-800',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    orange: 'border-orange-200 bg-orange-50 text-orange-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800'
  }

  return (
    <Card className={`border-2 ${colorClasses[errorInfo.color as keyof typeof colorClasses]}`}>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Icon className="w-6 h-6" />
          <div>
            <CardTitle className="text-lg">{errorInfo.title}</CardTitle>
            <CardDescription className="text-current opacity-80">
              {errorInfo.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">What you can try:</h4>
          <ul className="space-y-1 text-sm">
            {errorInfo.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-current opacity-60">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-2">
          {onRetry && (
            <Button 
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="bg-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {showMagicLinkOption && (
            <Link href="/auth/magic-signin">
              <Button variant="outline" size="sm" className="bg-white">
                ✨ Use Magic Link
              </Button>
            </Link>
          )}
          
          {errorInfo.title === 'Sign In Failed' && (
            <Link href="/auth/forgot-password">
              <Button variant="outline" size="sm" className="bg-white">
                Reset Password
              </Button>
            </Link>
          )}
          
          {errorInfo.title === 'Email Not Verified' && userEmail && (
            <Link href={`/auth/resend-verification?email=${encodeURIComponent(userEmail)}`}>
              <Button variant="outline" size="sm" className="bg-white">
                Resend Email
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}