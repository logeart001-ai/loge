'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'An unexpected error occurred during authentication'
  const errorDescription = searchParams.get('error_description') || ''

  // Provide more helpful error messages for common issues
  const getHelpfulErrorMessage = (errorMsg: string) => {
    if (errorMsg.includes('expired') || errorMsg.includes('Invalid or expired')) {
      return {
        title: 'Authentication Link Expired',
        message: 'The authentication link has expired or been used already.',
        suggestions: [
          'Request a new magic link from the sign-in page',
          'Make sure to use the link within 1 hour of receiving it',
          'Check that you\'re using the most recent email we sent'
        ]
      }
    }
    
    if (errorMsg.includes('invalid') || errorMsg.includes('Invalid')) {
      return {
        title: 'Invalid Authentication Link',
        message: 'The authentication link is not valid or has been corrupted.',
        suggestions: [
          'Make sure you clicked the complete link from your email',
          'Try copying and pasting the full URL if clicking didn\'t work',
          'Request a new magic link if the problem persists'
        ]
      }
    }
    
    return {
      title: 'Authentication Failed',
      message: errorMsg,
      suggestions: [
        'Try requesting a new authentication link',
        'Make sure you\'re using the same email address',
        'Contact support if the problem continues'
      ]
    }
  }

  const errorInfo = getHelpfulErrorMessage(error)

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
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-red-600">{errorInfo.title}</CardTitle>
          <CardDescription>
            {errorInfo.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="font-medium text-red-800 mb-2">What happened?</h3>
            <p className="text-sm text-red-700">
              {errorInfo.message}
            </p>
            {errorDescription && (
              <p className="text-xs text-red-600 mt-2">
                {errorDescription}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">What you can try:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {errorInfo.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span>•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <Link href="/auth/magic-signin">
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Magic Link Sign In
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500 mb-2">
              Need help? Contact our support team
            </p>
            <Link href="/support" className="text-orange-500 hover:underline text-sm">
              Get Support
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-orange-50 to-red-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}