# 📊 View Tracking System - Setup Guide

## ✅ What's Been Implemented

The view tracking system is now complete with the following features:

### 1. **Database Structure**
- ✅ `artwork_views` table for tracking individual views
- ✅ `artwork_view_counts` view for aggregated statistics
- ✅ Row Level Security (RLS) policies
- ✅ Database functions for efficient queries
- ✅ Indexes for performance

### 2. **API Endpoints**
- ✅ `POST /api/artworks/[id]/view` - Track artwork views
- ✅ Session-based tracking (prevents duplicate counts)
- ✅ IP and user agent logging
- ✅ 1-hour cooldown per session

### 3. **Client Components**
- ✅ `useTrackView` hook - Automatic view tracking
- ✅ `ArtworkViewTracker` component - Drop-in tracking
- ✅ `AnalyticsCard` component - Creator dashboard analytics
- ✅ 3-second delay before tracking (genuine interest)

### 4. **Analytics Functions**
- ✅ Get view stats for specific artwork
- ✅ Get total views for creator
- ✅ Get trending artworks
- ✅ Time-based metrics (today, week, month)

---

## 🚀 Setup Instructions

### Step 1: Run Database Migrations

Execute these SQL files in your Supabase SQL Editor in this order:

```sql
-- 1. Create the views table and policies
-- Run: create-views-table.sql

-- 2. Create helper functions
-- Run: create-view-functions.sql
```

**In Supabase Dashboard:**
1. Go to SQL Editor
2. Click "New Query"
3. Copy contents of `create-views-table.sql`
4. Click "Run"
5. Repeat for `create-view-functions.sql`

### Step 2: Install Dependencies

The view tracking system uses `uuid` for session IDs:

```bash
npm install uuid
npm install --save-dev @types/uuid
```

### Step 3: Verify Installation

Test the system:

```bash
# Start your development server
npm run dev

# Visit any artwork page
# Open browser console and check for:
# - No errors
# - Session cookie being set
# - View being tracked after 3 seconds
```

---

## 📖 Usage Guide

### For Artwork Pages

The artwork detail page already has view tracking enabled:

```tsx
// app/art/[id]/page.tsx
import { ArtworkViewTracker } from '@/components/artwork-view-tracker'

export default async function ArtworkDetailPage({ params }) {
  const artwork = await getArtworkById(params.id)
  
  return (
    <div>
      {/* This tracks views automatically */}
      <ArtworkViewTracker artworkId={artwork.id} />
      
      {/* Rest of your page */}
    </div>
  )
}
```

### For Creator Dashboard

Add the analytics card to show view statistics:

```tsx
// app/dashboard/creator/page.tsx
import { AnalyticsCard } from '@/components/creator/analytics-card'

export default function CreatorDashboard() {
  return (
    <div>
      {/* Shows view analytics */}
      <AnalyticsCard />
      
      {/* Rest of dashboard */}
    </div>
  )
}
```

### Get View Stats Programmatically

```tsx
import { getArtworkViewStats, getCreatorViewStats } from '@/lib/analytics'

// Get stats for a specific artwork
const stats = await getArtworkViewStats(artworkId)
console.log(stats)
// {
//   total_views: 1234,
//   unique_users: 567,
//   views_today: 45,
//   views_this_week: 234,
//   views_this_month: 890,
//   ...
// }

// Get stats for all creator's artworks
const creatorStats = await getCreatorViewStats(creatorId)
console.log(creatorStats)
// {
//   total_views: 5678,
//   total_artworks: 12,
//   artworks: [...]
// }
```

---

## 🎯 Features

### Smart Tracking
- ✅ **3-second delay**: Only tracks if user stays on page (genuine interest)
- ✅ **Session-based**: Same session won't count multiple times within 1 hour
- ✅ **Anonymous tracking**: Works for both logged-in and anonymous users
- ✅ **IP logging**: Tracks viewer IP for analytics (privacy-compliant)

### Analytics Metrics
- ✅ **Total views**: All-time view count
- ✅ **Unique users**: Count of unique authenticated users
- ✅ **Time-based**: Today, this week, this month
- ✅ **Trending**: Most viewed artworks in recent period

### Privacy & Performance
- ✅ **RLS policies**: Creators can only see their own artwork views
- ✅ **Indexed queries**: Fast performance even with millions of views
- ✅ **Aggregated views**: Pre-calculated counts for efficiency
- ✅ **Non-blocking**: View tracking doesn't slow down page loads

---

## 📊 Database Schema

### artwork_views Table
```sql
id              UUID PRIMARY KEY
artwork_id      UUID (references artworks)
viewer_id       UUID (references auth.users, nullable)
viewer_ip       TEXT
user_agent      TEXT
viewed_at       TIMESTAMP
session_id      TEXT
```

### artwork_view_counts View
```sql
artwork_id      UUID
total_views     BIGINT
unique_users    BIGINT
days_with_views BIGINT
last_viewed_at  TIMESTAMP
```

---

## 🔧 Customization

### Change Tracking Delay

Edit `hooks/use-track-view.ts`:

```tsx
// Change from 3 seconds to 5 seconds
setTimeout(async () => {
  // ...
}, 5000) // Changed from 3000
```

### Change Cooldown Period

Edit `app/api/artworks/[id]/view/route.ts`:

```tsx
// Change from 1 hour to 30 minutes
const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
```

### Add More Analytics

Extend `lib/analytics.ts` with custom functions:

```tsx
export async function getViewsByCountry(artworkId: string) {
  // Implement geo-location based analytics
}

export async function getViewsByDevice(artworkId: string) {
  // Implement device-based analytics
}
```

---

## 🐛 Troubleshooting

### Views Not Being Tracked

**Check:**
1. Database tables exist (run SQL migrations)
2. RLS policies are enabled
3. Browser console for errors
4. Session cookie is being set
5. API endpoint is responding (check Network tab)

**Common Issues:**
- **403 Forbidden**: RLS policy issue - check policies in Supabase
- **404 Not Found**: API route not found - check file path
- **No session cookie**: Check cookie settings in API route

### Analytics Not Showing

**Check:**
1. Creator has artworks in database
2. Artworks have been viewed (test by visiting artwork pages)
3. Database functions are created
4. User is authenticated

### Performance Issues

**Solutions:**
1. Ensure indexes are created (check `create-views-table.sql`)
2. Use aggregated view (`artwork_view_counts`) instead of raw table
3. Add caching for frequently accessed stats
4. Consider archiving old view data

---

## 📈 Next Steps

### Enhancements to Consider

1. **Geographic Analytics**
   - Track viewer location (country, city)
   - Show geographic distribution of views

2. **Device Analytics**
   - Parse user agent for device type
   - Track mobile vs desktop views

3. **Referrer Tracking**
   - Track where views come from
   - Measure marketing campaign effectiveness

4. **Engagement Metrics**
   - Track time spent on page
   - Track scroll depth
   - Track interactions (zoom, share, etc.)

5. **Real-time Dashboard**
   - Live view counter
   - Real-time notifications for creators
   - Live trending artworks

6. **Export & Reports**
   - CSV export of analytics
   - PDF reports for creators
   - Email summaries

---

## ✅ Testing Checklist

- [ ] Database tables created successfully
- [ ] Database functions work correctly
- [ ] View tracking works on artwork pages
- [ ] Session cookie is set properly
- [ ] Duplicate views are prevented (1-hour cooldown)
- [ ] Analytics show in creator dashboard
- [ ] View counts update correctly
- [ ] Trending artworks display properly
- [ ] RLS policies prevent unauthorized access
- [ ] Performance is acceptable (< 100ms for tracking)

---

## 🎉 You're Done!

The view tracking system is now fully operational. Creators can see how their artworks are performing, and you have a solid foundation for building more advanced analytics features.

**Key Benefits:**
- ✅ Creators get valuable insights
- ✅ You can identify trending content
- ✅ Better understanding of user behavior
- ✅ Data-driven decision making

**Questions or Issues?**
Check the troubleshooting section or review the code comments in the implementation files.
