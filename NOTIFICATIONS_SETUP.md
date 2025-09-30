# 🔔 Real-time Notifications System Setup

This guide covers the complete setup of the real-time notifications system for Loge Arts.

## 📋 Overview

The notification system provides:
- **Real-time notifications** via Supabase Realtime
- **Email integration** with Edge Functions
- **Toast notifications** for immediate feedback
- **Notification center** with unread counts
- **Notification history** and status tracking

---

## 🗄️ Database Setup

### 1. Run the Migration

The notifications table is already created in the migration file:

```bash
# Apply the migration
supabase db push
```

### 2. Verify Table Structure

The `notifications` table includes:
- `id` - Unique identifier
- `recipient_email` - Email of the recipient
- `subject` - Notification subject
- `content` - HTML/text content
- `type` - Notification type (email, submission_approved, etc.)
- `status` - Status (pending, sent, delivered, failed, opened)
- `metadata` - Additional data (JSONB)
- `sent_at`, `delivered_at`, `opened_at` - Timestamps
- `created_at`, `updated_at` - Standard timestamps

---

## 🔧 Component Integration

### 1. Add Notification Provider

Wrap your app with the notification provider in your root layout:

```tsx
// app/layout.tsx
import { LayoutWrapper } from './layout-wrapper'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  )
}
```

### 2. Add Notification Center to Navigation

Add the notification center to your navigation bar:

```tsx
import { NotificationCenter } from '@/components/notifications/notification-center'

function Navigation() {
  return (
    <nav className="flex items-center gap-4">
      {/* Other nav items */}
      <NotificationCenter />
    </nav>
  )
}
```

### 3. Install Required Dependencies

```bash
npm install @radix-ui/react-popover @radix-ui/react-scroll-area date-fns
```

---

## 🚀 Usage Examples

### 1. Creating Notifications Programmatically

```tsx
import { notificationService } from '@/lib/notification-service'

// Create a submission notification
await notificationService.createSubmissionNotification(
  'creator@example.com',
  'My Artwork Title',
  'approved',
  'Great work! Your submission meets our quality standards.'
)

// Create a payment notification
await notificationService.createPaymentNotification(
  'creator@example.com',
  5000,
  { id: 'order_123', item_title: 'Digital Art' }
)

// Create a custom notification
await notificationService.createNotification({
  recipient_email: 'user@example.com',
  subject: 'Welcome to Loge Arts!',
  content: 'Thank you for joining our community.',
  type: 'welcome',
  metadata: { user_id: '123', signup_date: new Date() }
})
```

### 2. Using Toast Notifications

```tsx
import { useToast } from '@/components/notifications/toast-notifications'

function MyComponent() {
  const { success, error, info, warning } = useToast()

  const handleSuccess = () => {
    success('Success!', 'Your action was completed successfully.')
  }

  const handleError = () => {
    error('Error!', 'Something went wrong. Please try again.')
  }

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
    </div>
  )
}
```

### 3. Accessing Notification Context

```tsx
import { useNotifications } from '@/components/notifications/notification-provider'

function MyComponent() {
  const { unreadCount, markAsRead, markAllAsRead } = useNotifications()

  return (
    <div>
      <p>Unread notifications: {unreadCount}</p>
      <button onClick={markAllAsRead}>Mark all as read</button>
    </div>
  )
}
```

---

## 🔄 Real-time Features

### 1. Automatic Updates

The system automatically:
- Updates unread counts when new notifications arrive
- Shows toast notifications for real-time events
- Syncs notification status across browser tabs
- Handles connection drops and reconnections

### 2. Subscription Management

Subscriptions are automatically managed:
- Created when user logs in
- Cleaned up when component unmounts
- Filtered by user email for security

---

## 🎨 Customization

### 1. Notification Types

Add custom notification types by extending the service:

```tsx
// In notification-service.ts
async createCustomNotification(
  userEmail: string,
  type: 'promotion' | 'feature_update' | 'maintenance',
  data: any
) {
  const templates = {
    promotion: {
      subject: '🎉 Special Offer Just for You!',
      content: `Check out our latest promotion...`,
    },
    // Add more templates
  }

  const template = templates[type]
  return this.createNotification({
    recipient_email: userEmail,
    subject: template.subject,
    content: template.content,
    type: type,
    metadata: data
  })
}
```

### 2. Custom Toast Styles

Modify toast styles in `toast-notifications.tsx`:

```tsx
const getToastStyles = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return 'border-l-4 border-l-green-500 bg-green-50'
    case 'custom':
      return 'border-l-4 border-l-purple-500 bg-purple-50'
    // Add custom styles
  }
}
```

---

## 🔒 Security & Privacy

### 1. Row Level Security (RLS)

The notifications table has RLS policies:
- Users can only see their own notifications
- Admins can see all notifications
- Notifications are filtered by recipient email

### 2. Data Privacy

- Email addresses are stored securely
- Notification content is sanitized
- Metadata is validated before storage

---

## 📊 Monitoring & Analytics

### 1. Notification Metrics

Track notification performance:

```sql
-- Delivery rates
SELECT 
  type,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
  ROUND(COUNT(CASE WHEN status = 'delivered' THEN 1 END) * 100.0 / COUNT(*), 2) as delivery_rate
FROM notifications 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY type;

-- Open rates
SELECT 
  type,
  COUNT(*) as total,
  COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened,
  ROUND(COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as open_rate
FROM notifications 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY type;
```

### 2. Cleanup Old Notifications

Set up a cron job to clean old notifications:

```tsx
// Run monthly
await notificationService.cleanupOldNotifications(90) // Keep 90 days
```

---

## 🐛 Troubleshooting

### 1. Notifications Not Appearing

Check:
- User is authenticated
- User email exists in profile
- RLS policies are correct
- Realtime is enabled in Supabase

### 2. Toast Notifications Not Working

Verify:
- NotificationProvider is wrapping the app
- ToastNotifications component is rendered
- No JavaScript errors in console

### 3. Real-time Connection Issues

Debug:
- Check Supabase connection status
- Verify channel subscriptions
- Monitor network connectivity

---

## 🚀 Next Steps

1. **Email Integration**: Set up Supabase Edge Functions with Resend
2. **Push Notifications**: Add web push notifications
3. **SMS Integration**: Add SMS notifications for critical alerts
4. **Advanced Analytics**: Build notification performance dashboard
5. **A/B Testing**: Test different notification templates

---

## 📚 Related Documentation

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Email Service Setup](./EMAIL_SERVICE_SETUP.md)
- [Edge Functions Guide](./EDGE_FUNCTIONS_SETUP.md)

---

The notification system is now ready to provide real-time updates and keep your users engaged! 🎉