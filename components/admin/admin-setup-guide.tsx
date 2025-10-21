'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { 
  Shield, 
  Copy, 
  CheckCircle, 
  Database, 
  User,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'

export function AdminSetupGuide() {
  const [user, setUser] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      
      setUser({ ...authUser, profile })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sqlScript = user ? `-- Make ${user.email} an admin
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = '${user.email}';

-- Verify the change
SELECT 
  id,
  full_name,
  email,
  role,
  'Admin access granted!' as status
FROM user_profiles
WHERE email = '${user.email}';` : ''

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <Shield className="w-16 h-16 text-orange-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Access Setup</h1>
          <p className="text-gray-600">Follow these steps to gain admin access to your platform</p>
        </div>

        {/* Current User Info */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Current User
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{user.profile?.full_name || 'No name set'}</p>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">ID: {user.id}</p>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={user.profile?.role === 'admin' ? 'default' : 'outline'}
                    className={user.profile?.role === 'admin' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {user.profile?.role || 'No role set'}
                  </Badge>
                  {user.profile?.role === 'admin' && (
                    <p className="text-sm text-green-600 mt-1">✅ You have admin access!</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Setup Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: Database Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Step 1: Access Supabase
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                You need access to your Supabase project's SQL Editor to grant admin permissions.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">How to access:</p>
                <ol className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>1. Go to your Supabase project dashboard</li>
                  <li>2. Click on "SQL Editor" in the sidebar</li>
                  <li>3. Create a new query</li>
                </ol>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Supabase Dashboard
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Run SQL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Step 2: Grant Admin Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Copy and run this SQL script in your Supabase SQL Editor:
              </p>
              
              {user ? (
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{sqlScript}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 bg-white"
                    onClick={() => copyToClipboard(sqlScript)}
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    Please sign in first to generate your personalized SQL script.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alternative Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Alternative Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Method 1: By Email</h4>
                <pre className="bg-gray-100 p-3 rounded text-sm">
{`UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Method 2: By User ID</h4>
                <pre className="bg-gray-100 p-3 rounded text-sm">
{`UPDATE user_profiles 
SET role = 'admin' 
WHERE id = 'your-user-id-here';`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification */}
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Verify Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              After running the SQL script:
            </p>
            <ol className="space-y-2 ml-4">
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                Refresh this page
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                Check that your role shows as "admin" above
              </li>
              <li className="flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                Try accessing <a href="/admin" className="text-blue-600 hover:underline">/admin</a>
              </li>
            </ol>
            
            <div className="flex gap-2">
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
              <Button variant="outline" asChild>
                <a href="/admin">Try Admin Access</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Note */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <Shield className="h-4 w-4 text-red-600 mt-0.5" />
          <div className="text-sm text-red-800">
            <strong>Security Note:</strong> Only grant admin access to trusted users. 
            Admins have full control over the platform including user management, content moderation, and system settings.
          </div>
        </div>
      </div>
    </div>
  )
}