# Environment Configuration Guide

## Overview

This guide explains all environment variables needed for the R.E.S.Q. system.

## Required Environment Variables

### Development (.env)

```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Development Settings
VITE_APP_ENV=development
```

### Production (Vercel Environment Variables)

Set these in Vercel Dashboard → Project Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_ENV=production
```

## Getting Your Supabase Credentials

### Step 1: Access Your Supabase Project

1. Go to https://supabase.com
2. Sign in to your account
3. Select your R.E.S.Q. project

### Step 2: Get Project URL

1. Go to **Settings** (gear icon in sidebar)
2. Click **API**
3. Find **Project URL** section
4. Copy the URL (format: `https://xxxxxxxxxxxxx.supabase.co`)

### Step 3: Get Anon Key

1. On the same API page
2. Find **Project API keys** section
3. Copy the **anon** / **public** key
4. It's a long JWT token starting with `eyJhbGc...`

⚠️ **Important**: Use the `anon` key, NOT the `service_role` key!

### Step 4: Update .env File

1. Open `.env` in your project root
2. Replace `your_supabase_url_here` with your Project URL
3. Replace `your_supabase_anon_key_here` with your anon key
4. Save the file

Example:

```env
VITE_SUPABASE_URL=https://abc123xyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyM3h5eiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk...
```

## Environment Variable Details

### VITE_SUPABASE_URL

- **Type**: String (URL)
- **Required**: Yes
- **Description**: Your Supabase project's API endpoint
- **Example**: `https://abc123xyz.supabase.co`
- **Where to get**: Supabase Dashboard → Settings → API → Project URL

### VITE_SUPABASE_ANON_KEY

- **Type**: String (JWT Token)
- **Required**: Yes
- **Description**: Public API key for client-side requests
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Where to get**: Supabase Dashboard → Settings → API → anon/public key
- **Security**: Safe to use in client-side code (RLS protects data)

### VITE_APP_ENV

- **Type**: String
- **Required**: No
- **Description**: Application environment
- **Values**: `development` | `production` | `staging`
- **Default**: `development`
- **Usage**: Conditional features, logging levels

## Why VITE\_ Prefix?

Vite requires all environment variables exposed to the client to be prefixed with `VITE_`. This is a security feature to prevent accidentally exposing server-only secrets.

❌ Wrong:

```env
SUPABASE_URL=https://...           # Won't work in Vite
SUPABASE_ANON_KEY=eyJhbG...        # Won't work in Vite
```

✅ Correct:

```env
VITE_SUPABASE_URL=https://...      # Will work
VITE_SUPABASE_ANON_KEY=eyJhbG...   # Will work
```

## Security Best Practices

### ✅ DO:

- Use the `anon` key for client-side code
- Keep `.env` file in `.gitignore`
- Use different Supabase projects for dev/prod
- Set environment variables in Vercel dashboard
- Regularly rotate API keys if compromised

### ❌ DON'T:

- Never commit `.env` file to Git
- Never use `service_role` key in frontend code
- Don't share your keys publicly
- Don't hardcode credentials in source code

## Verifying Configuration

### Test 1: Check .env File Exists

```bash
# In project root
ls -la .env
# Should show the file
```

### Test 2: Check Variables Are Set

Add temporary logging in `src/lib/supabase.js`:

```javascript
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("Has Anon Key:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

Start dev server and check browser console. Should show:

```
Supabase URL: https://xxxxxxxxxxxxx.supabase.co
Has Anon Key: true
```

⚠️ Remove console.logs after testing!

### Test 3: Test Connection

Try logging in to your app:

- If login works → Configuration is correct ✅
- If you get credential errors → Check `.env` file
- If you get network errors → Check Supabase project is running

## Environment-Specific Configuration

### Development Environment

```env
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev_anon_key_here
VITE_APP_ENV=development
```

### Production Environment (Vercel)

```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod_anon_key_here
VITE_APP_ENV=production
```

### Staging Environment (Optional)

```env
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging_anon_key_here
VITE_APP_ENV=staging
```

## Advanced Configuration (Future)

When you add more services, you might need:

```env
# Supabase (Required)
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# SMS Service (When implementing)
VITE_TWILIO_ACCOUNT_SID=...
VITE_TWILIO_AUTH_TOKEN=...        # Should be server-side only!
VITE_TWILIO_PHONE_NUMBER=...

# Map Service (When implementing)
VITE_MAPBOX_ACCESS_TOKEN=...
# or
VITE_GOOGLE_MAPS_API_KEY=...

# Analytics (Optional)
VITE_GA_TRACKING_ID=...

# Error Tracking (Optional)
VITE_SENTRY_DSN=...

# App Configuration
VITE_APP_NAME=R.E.S.Q.
VITE_APP_VERSION=1.0.0
```

⚠️ **Important**: Secrets like Twilio auth token should be in Supabase Edge Functions environment, not in frontend!

## Troubleshooting

### Error: "Missing Supabase environment variables"

**Cause**: `.env` file missing or variables not set

**Solution**:

1. Check `.env` file exists
2. Check variable names have `VITE_` prefix
3. Restart dev server after changing `.env`

### Error: "Invalid API key"

**Cause**: Wrong key or expired key

**Solution**:

1. Go to Supabase Dashboard → Settings → API
2. Copy the anon key again
3. Make sure you copied the entire key
4. Update `.env` file
5. Restart dev server

### Error: "Failed to fetch"

**Cause**: Wrong Supabase URL or project is paused

**Solution**:

1. Check Supabase project is active (not paused)
2. Verify URL in `.env` matches Dashboard
3. Check your internet connection
4. Verify Supabase is not having outages

### Changes Not Taking Effect

**Cause**: Dev server needs restart

**Solution**:

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

## Managing Multiple Environments

### Local Development

Use `.env` file (ignored by Git)

### Team Development

Share `.env.example` with team members:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Each developer copies to `.env` and adds their credentials.

### Production Deployment

Set variables in Vercel Dashboard:

1. Go to Project → Settings → Environment Variables
2. Add each variable
3. Select environments (Production, Preview, Development)
4. Redeploy if needed

## Quick Reference

| Variable                 | Required | Where to Get       | Security Level         |
| ------------------------ | -------- | ------------------ | ---------------------- |
| `VITE_SUPABASE_URL`      | Yes      | Supabase Dashboard | Public                 |
| `VITE_SUPABASE_ANON_KEY` | Yes      | Supabase Dashboard | Public (RLS Protected) |
| `VITE_APP_ENV`           | No       | Set manually       | Public                 |

## Next Steps

1. ✅ Set up `.env` file with Supabase credentials
2. ✅ Test connection by running `npm run dev`
3. ✅ Verify login works
4. ⏭️ When deploying, set variables in Vercel
5. ⏭️ When adding SMS, configure Twilio in Edge Functions
6. ⏭️ When adding maps, add map service API keys

---

**Remember**: The `.env` file should never be committed to Git. It's already in `.gitignore` to protect your credentials!
