'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase-client'

export default function TestSignOutPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const testServerSignOut = async () => {
    setLoading(true)
    try {
      console.log('Testing server signout...')
      const res = await fetch('/auth/signout', { method: 'POST' })
      const data = await res.json()
      
      setResults(prev => ({
        ...prev,
        serverSignOut: {
          status: res.status,
          ok: res.ok,
          data
        }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        serverSignOut: { error: error.message }
      }))
    } finally {
      setLoading(false)
    }
  }

  const testClientSignOut = async () => {
    setLoading(true)
    try {
      console.log('Testing client signout...')
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      setResults(prev => ({
        ...prev,
        clientSignOut: error ? { error: error.message } : { success: true }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        clientSignOut: { error: error.message }
      }))
    } finally {
      setLoading(false)
    }
  }

  const checkCurrentUser = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      setResults(prev => ({
        ...prev,
        currentUser: error ? { error: error.message } : { user: user ? { id: user.id, email: user.email } : null }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        currentUser: { error: error.message }
      }))
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults({})
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Sign Out Debug Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={checkCurrentUser} disabled={loading}>
                Check Current User
              </Button>
              <Button onClick={testServerSignOut} disabled={loading}>
                Test Server Sign Out
              </Button>
              <Button onClick={testClientSignOut} disabled={loading}>
                Test Client Sign Out
              </Button>
              <Button onClick={clearResults} variant="outline">
                Clear Results
              </Button>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold mb-4">Test Results:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded">
              <h4 className="font-semibold mb-2">Instructions:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>First, click "Check Current User" to see if you're signed in</li>
                <li>Try "Test Server Sign Out" to test the server route</li>
                <li>Try "Test Client Sign Out" to test direct Supabase signout</li>
                <li>Check the browser console for detailed logs</li>
                <li>After each test, click "Check Current User" again to see if you're still signed in</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}