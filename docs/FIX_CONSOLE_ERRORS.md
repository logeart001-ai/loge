# Fixing Console Errors - Events and Blog Posts

## Problem

You're seeing these console errors:
- `Error fetching blog posts: {}`
- `Error fetching upcoming events: {}`
- `Error fetching featured creators: {}`

## Root Cause

The `events` and `blog_posts` tables don't exist in your Supabase database yet. The empty error object `{}` indicates a database query failure rather than a JavaScript error.

## Solution

### Step 1: Run the Migration Script

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `scripts/12-events-blog-tables.sql`
5. Paste and click **Run**

### Step 2: Verify the Tables

After running the script, you should see:

```
table_name    | row_count
--------------+-----------
events        | 1
blog_posts    | 1
```

This confirms both tables were created with sample data.

### Step 3: Refresh Your App

1. Stop your Next.js dev server (Ctrl+C)
2. Restart it: `npm run dev`
3. Refresh your browser
4. The console errors should be gone!

## What the Migration Creates

### Events Table
- Stores art exhibitions, workshops, gallery openings, etc.
- Includes date, location, pricing, and publishing status
- Has RLS policies for secure access
- Sample event for testing

### Blog Posts Table
- Stores articles written by creators
- Includes title, content, excerpt, featured image
- Has slug for SEO-friendly URLs
- Sample blog post for testing

### Indexes
- Optimized queries for date filtering
- Fast lookups by author/organizer
- Efficient publishing status checks

### RLS Policies
- Public can view published content
- Authors/organizers can manage their own content
- Secure by default

## Testing

After migration, test the homepage:

1. **Featured Creators Section** - Should display creators
2. **Upcoming Events Section** - Should show the sample event
3. **Blog Posts Section** - Should display the sample blog post
4. **Console** - Should be error-free

## Next Steps

Once working, you can:
- Add more events through the creator dashboard
- Write blog posts as a creator
- Create an admin interface for managing featured content
- Add more sample data for testing

## Troubleshooting

### If errors persist:

1. **Check RLS Policies**: Make sure `user_profiles` table exists first
2. **Check Foreign Keys**: Verify `auth.users` and `user_profiles` are set up
3. **Run Core Migrations**: If nothing works, run `scripts/07-complete-setup.sql` first
4. **Clear Cache**: Delete `.next` folder and restart: `Remove-Item -Recurse -Force .next; npm run dev`

### If you see "column event_date does not exist":

The query uses `event_date` but the original schema might use `start_date`. The migration script includes both for compatibility.

## Alternative: Quick Fix Without Migration

If you don't want these features yet, you can temporarily disable them:

**In `app/page.tsx`**, comment out the problematic queries:

```typescript
// Temporarily disable until tables are created
const featuredCreators = [] // await getFeaturedCreators(3)
const upcomingEvents = [] // await getUpcomingEvents(3)
const blogPosts = [] // await getBlogPosts(3)
```

This will stop the errors but won't show any content in those sections.
