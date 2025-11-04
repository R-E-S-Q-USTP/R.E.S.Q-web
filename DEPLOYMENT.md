# R.E.S.Q. - Deployment Guide

## Deploying to Vercel

### Prerequisites

- GitHub account
- Vercel account (free tier is sufficient)
- Supabase project set up

### Step 1: Push to GitHub

1. Initialize git repository (if not already done):

```bash
git init
git add .
git commit -m "Initial commit - R.E.S.Q. Fire Monitoring System"
```

2. Create a new repository on GitHub

3. Push your code:

```bash
git remote add origin https://github.com/yourusername/resq-web.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure project:

   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:

   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

6. Click **Deploy**

### Step 3: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Go to **Settings** > **Domains**
3. Add your custom domain
4. Update DNS records as instructed

## Environment Variables

Make sure these are set in Vercel:

| Variable                 | Description                   |
| ------------------------ | ----------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL     |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

## Post-Deployment

### Update Supabase Settings

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **URL Configuration**
3. Add your Vercel deployment URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`

### Test Your Deployment

1. Visit your deployed URL
2. Try logging in with your admin credentials
3. Check that all pages load correctly
4. Verify real-time updates work

## Continuous Deployment

Vercel automatically redeploys when you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push
```

## Performance Optimization

### Recommended Vercel Settings

- **Node.js Version**: 18.x or later
- **Install Command**: `npm install`
- **Build Command**: `npm run build`

### Caching Strategy

Vercel automatically caches static assets. The app uses:

- Client-side caching for Supabase data
- React Query for server state management (optional upgrade)

## Monitoring

### Vercel Analytics

1. Go to **Analytics** in Vercel dashboard
2. Enable Web Analytics
3. Add this to your `index.html`:

```html
<script defer src="/_vercel/insights/script.js"></script>
```

### Error Tracking

Consider integrating:

- **Sentry** for error tracking
- **LogRocket** for session replay
- **Google Analytics** for usage analytics

## Troubleshooting

### Build Fails

Check:

- All dependencies are in `package.json`
- No TypeScript errors (if using TS)
- Environment variables are set

### App Works Locally but Not in Production

- Verify environment variables in Vercel
- Check browser console for CORS errors
- Ensure Supabase URLs are whitelisted

### Real-time Features Not Working

- Check Supabase Realtime is enabled
- Verify WebSocket connections aren't blocked
- Check browser console for connection errors

## Security Checklist

- ✅ Environment variables are set in Vercel (not in code)
- ✅ Supabase RLS policies are enabled
- ✅ HTTPS is enabled (automatic with Vercel)
- ✅ API keys are never committed to Git
- ✅ Authentication redirects are configured correctly

## Scaling Considerations

### When to Upgrade

- **Vercel**: Free tier is sufficient for small deployments
- **Supabase**: Free tier includes:
  - 500MB database
  - 1GB file storage
  - 2GB bandwidth

### If You Need More

1. Upgrade Supabase plan for:

   - More database space
   - Daily backups
   - Better performance

2. Upgrade Vercel plan for:
   - Custom domains
   - More bandwidth
   - Team features

## Backup Strategy

### Database Backups

Supabase Pro plan includes automatic daily backups. For free tier:

1. Use `pg_dump` to export database
2. Store backups securely
3. Schedule regular exports

### Manual Backup

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Dump database
supabase db dump > backup.sql
```

## Support

For issues:

- Check [Vercel Documentation](https://vercel.com/docs)
- Check [Supabase Documentation](https://supabase.com/docs)
- Review browser console errors
- Check network tab for failed requests
