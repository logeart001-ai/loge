# Supabase Authentication Settings Configuration

Since you disabled email confirmation, here are the settings you should verify in your Supabase dashboard:

## 1. Authentication Settings (Dashboard > Authentication > Settings)

### Email Confirmation Settings:
- **Enable email confirmations**: `DISABLED` ✅ (You already did this)
- **Enable email change confirmations**: `DISABLED` (recommended for development)
- **Enable secure email change**: `DISABLED` (recommended for development)

### Password Settings:
- **Minimum password length**: `8` (matches our validation)
- **Password requirements**: Enable if you want to enforce strong passwords

### Security Settings:
- **Enable phone confirmations**: `DISABLED` (unless you plan to use phone auth)
- **Enable manual linking**: `ENABLED` (allows linking accounts)

## 2. URL Configuration

Make sure these URLs are set correctly:

### Site URL:
```
http://localhost:3000
```

### Redirect URLs:
Add these to your allowed redirect URLs:
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
http://localhost:3000/dashboard/**
```

## 3. Email Templates (Optional)

Since email confirmation is disabled, you might want to:
- Keep the templates for password reset (still useful)
- Disable confirmation email template

## 4. Rate Limiting (Recommended)

Set appropriate rate limits:
- **Sign up**: 10 requests per hour per IP
- **Sign in**: 30 requests per hour per IP
- **Password reset**: 5 requests per hour per IP

## 5. JWT Settings

- **JWT expiry**: 3600 seconds (1 hour) - default is fine
- **Refresh token rotation**: `ENABLED` (recommended for security)

## 6. Testing Your Settings

After running the SQL migration, test with these users:
- `adedam5595@gmail.com` (now confirmed)
- `stephenojunde99@gmail.com` (already confirmed)
- `samueladeola333@gmail.com` (now confirmed)

## 7. For Production

When you deploy to production:
1. **Enable email confirmation** for better security
2. Set up proper email templates
3. Configure SMTP settings for email delivery
4. Update Site URL and Redirect URLs to your production domain

## Current Issue Resolution

The "Invalid login credentials" error should be resolved because:
1. Email confirmation is disabled (users don't need to confirm)
2. We manually confirmed existing users
3. New users won't need email confirmation
4. Better error messages in the app

## Next Steps

1. Run the SQL migration script in Supabase
2. Test login with existing users
3. Test signup with new users
4. Verify profile completion flow works