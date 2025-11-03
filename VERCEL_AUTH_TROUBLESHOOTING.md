# 🔧 Vercel Authentication Troubleshooting Guide

## 🚨 **Common Issues & Solutions**

### **1. Environment Variables**

**Check Vercel Environment Variables:**
1. Go to your Vercel Dashboard → Project → Settings → Environment Variables
2. Ensure these are set correctly:

```bash
# Required Supabase Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Application URL (CRITICAL for auth redirects)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app

# Node Environment
NODE_ENV=production
```

**⚠️ Common Mistakes:**
- Using `localhost` URLs in production
- Missing `NEXT_PUBLIC_APP_URL` or `NEXT_PUBLIC_SITE_URL`
- Incorrect Supabase URL format
- Using development keys in production

### **2. Supabase Authentication Settings**

**Update Supabase Dashboard Settings:**

1. **Go to Supabase Dashboard → Authentication → URL Configuration**

2. **Site URL:** Set to your Vercel domain
```
https://your-app.vercel.app
```

3. **Redirect URLs:** Add all these URLs
```
https://your-app.vercel.app/auth/callback
https://your-app.vercel.app/auth/confirm
https://your-app.vercel.app/auth/reset-password
https://your-app.vercel.app/dashboard/**
https://your-app.vercel.app/**
```

4. **Additional Redirect URLs (if using custom domains):**
```
https://your-custom-domain.com/auth/callback
https://your-custom-domain.com/auth/confirm
https://your-custom-domain.com/dashboard/**
```

### **3. Cookie and Session Issues**

**Common Vercel Cookie Problems:**

1. **Secure Cookie Settings**
   - Vercel requires HTTPS for secure cookies
   - Supabase automatically handles this in production

2. **Domain Mismatch**
   - Ensure your app URL matches your Vercel deployment URL
   - Check for www vs non-www issues

3. **SameSite Cookie Issues**
   - Supabase handles this automatically
   - Ensure you're not overriding cookie settings

### **4. Redirect Loop Issues**

**Fix Infinite Redirects:**

1. **Check middleware.ts** (if you have one):
```typescript
// Make sure middleware doesn't interfere with auth
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth).*)',
  ],
}
```

2. **Check auth callback route** - ensure it's working properly

### **5. Network and CORS Issues**

**Supabase CORS Configuration:**
- Supabase automatically allows your Vercel domain
- If using custom domains, add them to Supabase settings

**Check Network Requests:**
1. Open browser DevTools → Network tab
2. Try to sign in and watch for failed requests
3. Look for 401, 403, or CORS errors

### **6. Database Connection Issues**

**Row Level Security (RLS) Problems:**
- Ensure RLS policies allow authenticated users
- Check if user_profiles table has proper policies

**Run this SQL in Supabase to check policies:**
```sql
-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';
```

## 🔍 **Debugging Steps**

### **Step 1: Check Vercel Logs**
1. Go to Vercel Dashboard → Project → Functions tab
2. Look for runtime errors during authentication
3. Check for environment variable issues

### **Step 2: Test Authentication Flow**
1. **Sign Up Test:**
   - Try creating a new account
   - Check if confirmation email is sent
   - Verify user appears in Supabase Auth dashboard

2. **Sign In Test:**
   - Try signing in with existing account
   - Check browser DevTools for errors
   - Verify session cookies are set

### **Step 3: Supabase Dashboard Checks**
1. **Authentication → Users:** Check if users exist
2. **Authentication → Logs:** Look for auth errors
3. **Database → user_profiles:** Verify profiles are created

### **Step 4: Browser Testing**
1. **Clear all cookies and cache**
2. **Try incognito/private mode**
3. **Test on different browsers**
4. **Check mobile browsers**

## 🛠️ **Quick Fixes**

### **Fix 1: Redeploy with Correct Environment Variables**
```bash
# In your local terminal
vercel env pull .env.local
# Check the downloaded file for correct values
# Update any incorrect values in Vercel dashboard
vercel --prod
```

### **Fix 2: Update Supabase URLs**
1. Go to Supabase Dashboard → Settings → API
2. Copy the correct Project URL and anon key
3. Update in Vercel environment variables
4. Redeploy

### **Fix 3: Reset Authentication State**
```sql
-- Run in Supabase SQL Editor to reset a user's auth state
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'user@example.com';
```

### **Fix 4: Force Cookie Refresh**
Add this to your auth callback:
```typescript
// In app/auth/callback/route.ts
export async function GET(request: NextRequest) {
  // ... existing code ...
  
  // Force cookie refresh
  const response = NextResponse.redirect(`${origin}${redirectPath}`)
  response.cookies.delete('supabase-auth-token')
  return response
}
```

## 🚀 **Production Deployment Checklist**

### **Before Deploying:**
- [ ] All environment variables set in Vercel
- [ ] Supabase URLs updated to production domain
- [ ] Email confirmation disabled (or SMTP configured)
- [ ] RLS policies tested and working
- [ ] Auth callback routes working locally

### **After Deploying:**
- [ ] Test sign up flow on production
- [ ] Test sign in flow on production
- [ ] Test password reset flow
- [ ] Test OAuth (Google) if enabled
- [ ] Check Vercel function logs for errors
- [ ] Verify user profiles are created correctly

### **Monitoring:**
- [ ] Set up Supabase auth webhooks (optional)
- [ ] Monitor Vercel function logs
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor user sign-up success rates

## 📞 **Getting Help**

### **If Still Having Issues:**

1. **Check Vercel Function Logs:**
   - Look for specific error messages
   - Note the exact time of failures

2. **Check Supabase Auth Logs:**
   - Go to Supabase Dashboard → Authentication → Logs
   - Look for failed authentication attempts

3. **Test Locally vs Production:**
   - If it works locally but not on Vercel, it's likely environment/URL config
   - If it doesn't work locally either, it's likely code or Supabase config

4. **Common Error Messages:**
   - "Invalid login credentials" → Check email confirmation settings
   - "Network error" → Check environment variables and URLs
   - "Configuration error" → Missing environment variables
   - Redirect loops → Check middleware and auth callback

### **Debug Information to Collect:**
- Exact error messages from browser console
- Vercel function logs
- Supabase auth logs
- Environment variable values (redacted)
- Steps to reproduce the issue

## 🎯 **Most Likely Solutions**

**90% of Vercel auth issues are caused by:**

1. **Wrong `NEXT_PUBLIC_APP_URL`** - must match your Vercel domain exactly
2. **Missing Supabase redirect URLs** - must include your Vercel domain
3. **Environment variables not set** - especially the public ones
4. **Email confirmation enabled** - disable for easier testing
5. **RLS policies blocking access** - ensure policies allow authenticated users

**Quick Test:**
Try this URL in your browser (replace with your domain):
```
https://your-app.vercel.app/auth/signin
```

If the page loads but sign-in fails, it's likely environment variables or Supabase configuration. If the page doesn't load, it's likely a deployment issue.

The authentication system is robust and should work on Vercel with proper configuration! 🚀