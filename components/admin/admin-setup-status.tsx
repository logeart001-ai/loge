'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Database, RefreshCw } from 'lucide-react'

interface TableStatus {
  name: string
  exists: boolean
  description: string
  required: boolean
}

export function AdminSetupStatus() {
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const requiredTables = [
    { name: 'user_profiles', description: 'User profile information', required: true },
    { name: 'project_submissions', description: 'Creator submissions for review', required: true },
    { name: 'submission_reviews', description: 'Admin reviews of submissions', required: true },
    { name: 'submission_media', description: 'Media files for submissions', required: true },
    { name: 'content_reports', description: 'Content moderation reports', required: true },
    { name: 'artist_submissions', description: 'Artist-specific submission data', required: false },
    { name: 'writer_submissions', description: 'Writer-specific submission data', required: false },
    { name: 'fashion_submissions', description: 'Fashion designer submission data', required: false }
  ]

  useEffect(() => {
    checkTableStatuses()
  }, [])

  const checkTableStatuses = async () => {
    setLoading(true)
    setError(null)

    try {
      const statuses: TableStatus[] = []

      for (const table of requiredTables) {
        try {
          // Try to query the table with a limit to check if it exists
          const { error } = await supabase
            .from(table.name)
            .select('*')
            .limit(1)

          const exists = !error || (error.code !== '42P01' && !error.message?.includes('does not exist'))
          
          statuses.push({
            ...table,
            exists
          })
        } catch (err) {
          statuses.push({
            ...table,
            exists: false
          })
        }
      }

      setTableStatuses(statuses)
    } catch (err) {
      console.error('Error checking table statuses:', err)
      setError('Failed to check database status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (exists: boolean, required: boolean) => {
    if (exists) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else if (required) {
      return <XCircle className="w-5 h-5 text-red-500" />
    } else {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusBadge = (exists: boolean, required: boolean) => {
    if (exists) {
      return <Badge className="bg-green-100 text-green-800">Ready</Badge>
    } else if (required) {
      return <Badge className="bg-red-100 text-red-800">Missing</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Optional</Badge>
    }
  }

  const requiredTablesCount = tableStatuses.filter(t => t.required).length
  const readyRequiredTables = tableStatuses.filter(t => t.required && t.exists).length
  const isFullyConfigured = requiredTablesCount > 0 && readyRequiredTables === requiredTablesCount

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Checking database configuration...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <CardTitle>Admin Dashboard Setup Status</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={checkTableStatuses}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className={`p-4 rounded-lg border ${
          isFullyConfigured 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {isFullyConfigured ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            <h3 className="font-semibold">
              {isFullyConfigured ? 'Admin Dashboard Ready!' : 'Setup Required'}
            </h3>
          </div>
          <p className="text-sm text-gray-600">
            {isFullyConfigured 
              ? 'All required database tables are configured and ready to use.'
              : `${readyRequiredTables}/${requiredTablesCount} required tables are configured.`
            }
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Table Status List */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Database Tables</h4>
          {tableStatuses.map((table) => (
            <div key={table.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(table.exists, table.required)}
                <div>
                  <p className="font-medium text-gray-900">{table.name}</p>
                  <p className="text-sm text-gray-600">{table.description}</p>
                </div>
              </div>
              {getStatusBadge(table.exists, table.required)}
            </div>
          ))}
        </div>

        {/* Setup Instructions */}
        {!isFullyConfigured && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Setup Instructions</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Go to your Supabase dashboard</li>
              <li>2. Open the SQL Editor</li>
              <li>3. Run the <code className="bg-blue-100 px-1 rounded">fix-admin-dashboard-errors.sql</code> script</li>
              <li>4. Refresh this page to verify the setup</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}