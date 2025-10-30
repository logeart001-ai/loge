# Supabase Email Configuration Guide

## Overview

Supabase provides built-in email templates for authentication flows. This guide shows you how to customize them for L'oge Arts branding.

## Accessing Email Templates

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `sfwopulinzmpupmgaqyw`
3. Navigate to **Authentication** → **Email Templates**

## Available Templates

### 1. Confirm Signup (Email Confirmation)

**When sent:** User creates an account
**Default subject:** "Confirm Your Email"
**Variables available:**

- `{{ .ConfirmationURL }}` - Link to confirm email
- `{{ .Token }}` - Token for manual confirmation
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your site URL (<https://logeart.vercel.app>)

**Recommended Custom Template:**

```html
<h2>Welcome to L'oge Arts! 🎨</h2>

<p>Hi there,</p>

<p>Thank you for signing up for L'oge Arts - Nigeria's premier platform for discovering and purchasing authentic African art, fashion, and literature.</p>

<p>To complete your registration and start exploring, please confirm your email address by clicking the button below:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
    Confirm Email Address
  </a>
</p>

<p>Or copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>

<p>If you didn't create an account with L'oge Arts, you can safely ignore this email.</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #6b7280; font-size: 12px;">
  Best regards,<br>
  The L'oge Arts Team<br>
  <a href="https://logeart.vercel.app" style="color: #f97316;">logeart.vercel.app</a>
</p>
```

### 2. Reset Password (Forgot Password)

**When sent:** User requests password reset
**Default subject:** "Reset Your Password"
**Variables available:**

- `{{ .ConfirmationURL }}` - Password reset link
- `{{ .Token }}` - Token for manual reset
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your site URL

**Recommended Custom Template:**

```html
<h2>Password Reset Request 🔒</h2>

<p>Hi there,</p>

<p>We received a request to reset the password for your L'oge Arts account.</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
    Reset Password
  </a>
</p>

<p>Or copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>

<p style="background: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; border-radius: 4px; margin: 20px 0;">
  <strong>⚠️ Security Note:</strong><br>
  This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and ensure your account is secure.
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #6b7280; font-size: 12px;">
  Best regards,<br>
  The L'oge Arts Team<br>
  <a href="https://logeart.vercel.app" style="color: #f97316;">logeart.vercel.app</a>
</p>
```

### 3. Magic Link

**When sent:** User requests passwordless login
**Default subject:** "Your Magic Link"
**Variables available:** Same as password reset

**Recommended Custom Template:**

```html
<h2>Your Magic Link 🪄</h2>

<p>Hi there,</p>

<p>Click the button below to sign in to your L'oge Arts account instantly - no password needed!</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
    Sign In to L'oge Arts
  </a>
</p>

<p>Or copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>

<p style="color: #dc2626; font-size: 14px;">
  ⏱️ This link expires in 1 hour and can only be used once.
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #6b7280; font-size: 12px;">
  Best regards,<br>
  The L'oge Arts Team<br>
  <a href="https://logeart.vercel.app" style="color: #f97316;">logeart.vercel.app</a>
</p>
```

### 4. Change Email Address

**When sent:** User changes their email
**Default subject:** "Confirm Email Change"

**Recommended Custom Template:**

```html
<h2>Confirm Email Change 📧</h2>

<p>Hi there,</p>

<p>You recently requested to change the email address associated with your L'oge Arts account.</p>

<p><strong>New email:</strong> {{ .Email }}</p>

<p>To complete this change, please confirm by clicking the button below:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
    Confirm Email Change
  </a>
</p>

<p style="background: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; border-radius: 4px; margin: 20px 0;">
  <strong>⚠️ Security Note:</strong><br>
  If you didn't request this change, please contact our support team immediately.
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="color: #6b7280; font-size: 12px;">
  Best regards,<br>
  The L'oge Arts Team<br>
  <a href="https://logeart.vercel.app" style="color: #f97316;">logeart.vercel.app</a>
</p>
```

## SMTP Configuration (Optional - For Production)

### Option 1: Use Supabase's Email Service (Easiest)

- **Pros:** Free, no setup required, works immediately
- **Cons:** Limited to 3 emails/hour per user (rate limited)
- **Best for:** Development and testing

### Option 2: Custom SMTP (Recommended for Production)

Configure your own SMTP in **Settings** → **Auth** → **SMTP Settings**

**Recommended Providers:**

1. **Resend** (Modern, Developer-friendly)
   - Free: 3,000 emails/month
   - From: `noreply@logeart.com` (custom domain)
   - Setup: <https://resend.com>

2. **SendGrid** (Enterprise-grade)
   - Free: 100 emails/day
   - Reliable delivery
   - Setup: <https://sendgrid.com>

3. **Amazon SES** (Cost-effective)
   - $0.10 per 1,000 emails
   - High deliverability
   - Setup: <https://aws.amazon.com/ses>

### SMTP Configuration Steps

1. Go to **Settings** → **Auth** → **SMTP Settings** in Supabase
2. Enable "Use Custom SMTP Server"
3. Enter your SMTP details:

   ```text
   Host: smtp.resend.com
   Port: 587 (or 465 for SSL)
   Username: resend
   Password: [Your Resend API Key]
   Sender email: noreply@logeart.com
   Sender name: L'oge Arts
   ```

4. Click "Save"

## Email URL Configuration

Ensure these URLs are correct in **Settings** → **Auth** → **URL Configuration**:

```text
Site URL: https://logeart.vercel.app
Redirect URLs:
  - https://logeart.vercel.app/auth/callback
  - https://logeart.vercel.app/auth/confirmed
  - https://logeart.vercel.app/auth/reset-password
  - http://localhost:3000/auth/callback (for development)
  - http://localhost:3000/auth/confirmed
  - http://localhost:3000/auth/reset-password
```

## Rate Limiting

Supabase applies rate limits to prevent abuse:

- **3 emails per hour** per user for auth emails (signup, password reset)
- **Unlimited** for custom emails (via Edge Functions)

To avoid issues:

1. Don't resend confirmation emails too quickly
2. Use custom email service for non-auth emails
3. In production, set up custom SMTP

## Testing Email Delivery

### Test Email Confirmation

1. Create a test account in your app
2. Check your email inbox
3. Click confirmation link
4. Verify you're redirected to `/auth/confirmed`

### Test Password Reset

1. Go to `/auth/forgot-password`
2. Enter your email
3. Check inbox for reset email
4. Click link
5. Verify redirect to `/auth/reset-password`

## Troubleshooting

### Emails Not Being Received

1. **Check spam folder** - Auth emails often end up in spam
2. **Verify email address** - Ensure it's valid
3. **Check Supabase logs** - Go to **Database** → **Logs**
4. **Rate limit hit** - Wait 1 hour if you've sent 3+ emails
5. **SMTP errors** - Check SMTP configuration in Settings

### Email Links Not Working

1. **Check URL configuration** - Ensure Site URL and Redirect URLs are correct
2. **Token expired** - Links expire after 1 hour
3. **Already used** - Links can only be used once
4. **CORS issues** - Ensure your domain is whitelisted

## Best Practices

1. ✅ **Customize all templates** with your branding
2. ✅ **Set up custom SMTP** for production
3. ✅ **Test thoroughly** in development
4. ✅ **Monitor email logs** in Supabase dashboard
5. ✅ **Use custom emails** for business logic (orders, notifications)
6. ✅ **Keep auth emails** handled by Supabase
7. ❌ **Don't spam users** - respect rate limits
8. ❌ **Don't use Supabase emails** for marketing

## Summary - Email Strategy

| Email Type | Service | Why |
|------------|---------|-----|
| Email confirmation | Supabase Auth | Built-in, secure, reliable |
| Password reset | Supabase Auth | Built-in, secure, reliable |
| Magic link login | Supabase Auth | Built-in, secure, reliable |
| Welcome email | Custom (Edge Function) | More control, custom design |
| Order confirmations | Custom (Edge Function) | Business logic required |
| Submission updates | Custom (Edge Function) | Business logic required |
| New followers | Custom (Edge Function) | Business logic required |
| Artwork sold | Custom (Edge Function) | Business logic required |
| Marketing | Custom (Edge Function) | Full control, segmentation |

## Next Steps

1. ✅ Customize Supabase auth email templates (copy templates above)
2. ✅ Set up custom SMTP with Resend (optional but recommended)
3. ✅ Verify redirect URLs are configured correctly
4. ✅ Test email flows end-to-end
5. ✅ Run database migration for notification preferences
6. ✅ Use custom email service for business emails

Your authentication emails are already working! Just customize the templates to match your brand. 🎨
