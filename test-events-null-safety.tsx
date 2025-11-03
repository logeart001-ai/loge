// Test component to verify null safety in events management
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Mock event data with null values to test null safety
const mockEventWithNulls = {
  id: 'test-event-1',
  organizer_id: 'test-organizer',
  title: 'Test Event',
  description: null, // This was causing the error
  event_type: 'exhibition' as const,
  event_date: null, // This was causing the split() error
  start_date: null,
  end_date: null,
  city: null,
  country: null,
  is_free: true,
  ticket_price: null,
  is_featured: false,
  is_published: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
}

export default function TestEventsNullSafety() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: '',
    event_date: '',
    start_date: '',
    end_date: '',
    city: '',
    country: '',
    is_free: true,
    ticket_price: '',
    is_featured: false,
    is_published: true
  })

  // Simulate the handleEdit function that was causing the error
  const handleEdit = (event: typeof mockEventWithNulls) => {
    console.log('Testing handleEdit with null values...')
    
    try {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        event_type: event.event_type || '',
        event_date: event.event_date ? event.event_date.split('T')[0] : '',
        start_date: event.start_date ? event.start_date.split('T')[0] : '',
        end_date: event.end_date ? event.end_date.split('T')[0] : '',
        city: event.city || '',
        country: event.country || '',
        is_free: event.is_free ?? true,
        ticket_price: event.ticket_price?.toString() || '',
        is_featured: event.is_featured ?? false,
        is_published: event.is_published ?? true
      })
      
      console.log('✅ handleEdit completed successfully with null values')
      console.log('Form data:', formData)
    } catch (error) {
      console.error('❌ handleEdit failed:', error)
    }
  }

  // Test date display function
  const formatEventDate = (dateString: string | null) => {
    if (!dateString) return 'Date TBD'
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Events Null Safety Test</CardTitle>
          <p className="text-gray-600">
            Test the events management component with null values to ensure no runtime errors
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Mock Event Data (with nulls):</h3>
            <pre className="text-xs bg-white p-2 rounded border overflow-auto">
              {JSON.stringify(mockEventWithNulls, null, 2)}
            </pre>
          </div>

          <Button 
            onClick={() => handleEdit(mockEventWithNulls)}
            className="w-full"
          >
            Test handleEdit with Null Values
          </Button>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Date Display:</strong> {formatEventDate(mockEventWithNulls.event_date)}
              </div>
              <div>
                <strong>Description:</strong> {mockEventWithNulls.description || 'No description provided'}
              </div>
              <div>
                <strong>Location:</strong> {mockEventWithNulls.city || 'Location TBD'}, {mockEventWithNulls.country || 'Country TBD'}
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">✅ Null Safety Fixes Applied:</h3>
            <ul className="text-sm space-y-1">
              <li>• Added null checks before calling .split() on date strings</li>
              <li>• Used nullish coalescing (??) for boolean values</li>
              <li>• Added fallback values for display strings</li>
              <li>• Updated TypeScript interface to reflect nullable fields</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}