'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Bell, Mail, ShoppingCart, FileText, Users, Heart, TrendingUp, Megaphone } from 'lucide-react'

interface NotificationPreferences {
  email_notifications_enabled: boolean
  notify_order_updates: boolean
  notify_submission_updates: boolean
  notify_new_followers: boolean
  notify_new_reviews: boolean
  notify_artwork_sold: boolean
  notify_marketing: boolean
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications_enabled: true,
    notify_order_updates: true,
    notify_submission_updates: true,
    notify_new_followers: true,
    notify_new_reviews: true,
    notify_artwork_sold: true,
    notify_marketing: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchPreferences()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setMessage({ type: 'error', text: 'You must be logged in' })
        return
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('email_notifications_enabled, notify_order_updates, notify_submission_updates, notify_new_followers, notify_new_reviews, notify_artwork_sold, notify_marketing')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data) {
        setPreferences(data)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
      setMessage({ type: 'error', text: 'Failed to load preferences' })
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setMessage({ type: 'error', text: 'You must be logged in' })
        return
      }

      const { error } = await supabase
        .from('user_profiles')
        .update(preferences)
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Notification preferences saved successfully!' })
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
      setMessage({ type: 'error', text: 'Failed to save preferences' })
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const notificationOptions = [
    {
      key: 'notify_order_updates' as keyof NotificationPreferences,
      icon: ShoppingCart,
      title: 'Order Updates',
      description: 'Get notified about order confirmations, shipping updates, and deliveries'
    },
    {
      key: 'notify_submission_updates' as keyof NotificationPreferences,
      icon: FileText,
      title: 'Submission Updates',
      description: 'Receive updates when your submissions are approved, rejected, or need revision'
    },
    {
      key: 'notify_new_followers' as keyof NotificationPreferences,
      icon: Users,
      title: 'New Followers',
      description: 'Get notified when someone starts following you'
    },
    {
      key: 'notify_new_reviews' as keyof NotificationPreferences,
      icon: Heart,
      title: 'Reviews & Ratings',
      description: 'Be notified when someone reviews or rates your artwork'
    },
    {
      key: 'notify_artwork_sold' as keyof NotificationPreferences,
      icon: TrendingUp,
      title: 'Artwork Sales',
      description: 'Get instant notifications when your artwork is purchased'
    },
    {
      key: 'notify_marketing' as keyof NotificationPreferences,
      icon: Megaphone,
      title: 'Marketing & Promotions',
      description: 'Receive news, tips, and promotional offers from L\'oge Arts'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-orange-600" />
          <CardTitle>Email Notification Preferences</CardTitle>
        </div>
        <CardDescription>
          Manage which email notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-orange-600" />
            <div>
              <Label htmlFor="email_notifications_enabled" className="text-base font-semibold">
                Email Notifications
              </Label>
              <p className="text-sm text-gray-600">
                Master toggle for all email notifications
              </p>
            </div>
          </div>
          <Switch
            id="email_notifications_enabled"
            checked={preferences.email_notifications_enabled}
            onCheckedChange={(checked) => updatePreference('email_notifications_enabled', checked)}
          />
        </div>

        {/* Individual Notification Options */}
        <div className="space-y-4">
          {notificationOptions.map((option) => {
            const Icon = option.icon
            return (
              <div
                key={option.key}
                className={`flex items-center justify-between p-4 rounded-lg border transition-opacity ${
                  preferences.email_notifications_enabled
                    ? 'border-gray-200 bg-white'
                    : 'border-gray-100 bg-gray-50 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <Label
                      htmlFor={option.key}
                      className={`text-sm font-medium ${
                        !preferences.email_notifications_enabled ? 'text-gray-400' : ''
                      }`}
                    >
                      {option.title}
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={option.key}
                  checked={preferences[option.key]}
                  onCheckedChange={(checked) => updatePreference(option.key, checked)}
                  disabled={!preferences.email_notifications_enabled}
                />
              </div>
            )
          })}
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={savePreferences}
          disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Note: You will always receive important account security emails regardless of these settings
        </p>
      </CardContent>
    </Card>
  )
}
