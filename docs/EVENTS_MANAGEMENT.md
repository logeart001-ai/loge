# Events Management - Admin Dashboard

## Overview
The Events Management feature has been successfully added to your admin dashboard. Admins can now create, edit, and manage art events, exhibitions, workshops, and more directly from the admin panel.

## Accessing Events Management

1. Navigate to `/admin` in your browser
2. Click on the **"Events"** tab in the sidebar
3. The Events Management interface will display

## Features

### Dashboard Statistics
- **Total Events**: Shows the total number of events in the system
- **Published**: Number of events currently published and visible to users
- **Featured**: Number of events marked as featured
- **Upcoming**: Number of events with dates in the future

### Creating a New Event

1. Click the **"Add Event"** button in the top-right corner
2. Fill in the event details:
   - **Event Title** * (required): e.g., "Lagos Contemporary Art Exhibition"
   - **Description** * (required): Detailed description of the event
   - **Event Type** * (required): Choose from:
     - Exhibition
     - Workshop
     - Gallery Opening
     - Art Fair
     - Networking Event
   - **Event Date** * (required): Main event date
   - **Start Date**: Optional, for multi-day events
   - **End Date**: Optional, for multi-day events
   - **City** * (required): e.g., Lagos
   - **Country** * (required): e.g., Nigeria
   - **Free Event**: Check if the event is free
   - **Ticket Price**: If not free, enter the price in Naira (₦)
   - **Featured Event**: Check to feature this event on the homepage
   - **Published**: Check to make the event visible to users

3. Click **"Create Event"** to save

### Editing an Event

1. Find the event in the list
2. Click the **"Edit"** button
3. Update the event details
4. Click **"Update Event"** to save changes

### Managing Event Visibility

Each event has quick action buttons:

- **Edit**: Modify event details
- **Publish/Unpublish**: Toggle event visibility
  - Published events appear in the events list on the frontend
  - Unpublished events are hidden from users (draft mode)
- **Feature/Unfeature**: Toggle featured status
  - Featured events appear prominently on the homepage
  - Only feature your most important events
- **Delete**: Permanently remove the event (requires confirmation)

### Event Types and Colors

Events are color-coded by type for easy identification:

- 🟣 **Exhibition**: Purple
- 🔵 **Workshop**: Blue
- 🟢 **Gallery Opening**: Green
- 🟡 **Art Fair**: Yellow
- 🩷 **Networking**: Pink

## Database Structure

The events are stored in the `events` table with the following key fields:

- `id`: Unique event identifier
- `organizer_id`: ID of the user who created the event
- `title`: Event title
- `description`: Event description
- `event_type`: Type of event (enum)
- `event_date`: Main event date
- `start_date`: Event start date (for multi-day events)
- `end_date`: Event end date (for multi-day events)
- `city`: Event city
- `country`: Event country
- `is_free`: Whether the event is free
- `ticket_price`: Price in Naira (if not free)
- `is_featured`: Featured on homepage
- `is_published`: Visible to users
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Row-Level Security (RLS)

The events table has RLS policies:

- **Public Read**: Anyone can view published events
- **Authenticated Create**: Logged-in users can create events
- **Organizer Update/Delete**: Only the event organizer can modify/delete their events
- **Admin Full Access**: Admin users have full control over all events

## Frontend Integration

Events created here will automatically appear:

1. **Events Page** (`/events`): All published events
2. **Homepage**: Featured events in the "Upcoming Events" section
3. **Event Queries**: The `getUpcomingEvents()` function fetches events from this table

## Sample Data

One sample event was created during the migration:

- **Title**: "Contemporary Nigerian Art Exhibition"
- **Type**: Exhibition
- **Date**: December 15, 2024
- **Location**: Lagos, Nigeria
- **Status**: Published and Featured

You can edit or delete this sample event as needed.

## Tips for Best Practices

1. **Featured Events**: Only feature 3-5 events at a time for optimal homepage display
2. **Event Dates**: Keep events up to date and remove or unpublish past events
3. **Descriptions**: Write clear, engaging descriptions to attract attendees
4. **Pricing**: Use realistic prices in Naira (₦)
5. **Multi-day Events**: For events spanning multiple days, fill in both start_date and end_date
6. **Draft Mode**: Use unpublished status to prepare events before going live

## Troubleshooting

### "You must be logged in to create events"
- Ensure you're logged in to the admin account
- Check that your session hasn't expired

### Events not appearing on frontend
- Verify the event is marked as **Published**
- Check that the event_date is valid
- Refresh the homepage or events page

### Can't edit/delete an event
- Only the event organizer (creator) can modify events
- Admin users should have full access via RLS policies
- Check browser console for error messages

## Next Steps

You can extend this feature by:

1. Adding image uploads for event banners
2. Creating a public event detail page
3. Adding RSVP/ticketing functionality
4. Implementing event categories or tags
5. Adding email notifications for new events

---

**Need Help?**
Check the browser console (F12) for detailed error messages if something isn't working as expected.
