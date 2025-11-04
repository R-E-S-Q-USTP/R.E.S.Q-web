# R.E.S.Q. Database Setup Guide

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in the project details:
   - **Name**: R.E.S.Q. Fire Monitoring
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to Cagayan de Oro (e.g., Southeast Asia)

## Step 2: Run the Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `schema.sql`
4. Paste it into the SQL editor
5. Click **Run** or press `Ctrl+Enter`

This will create:

- All database tables
- Indexes for performance
- Row Level Security (RLS) policies
- Functions and triggers
- Sample test data

## Step 3: Configure Storage

The schema already creates the storage bucket, but verify:

1. Go to **Storage** in your Supabase dashboard
2. You should see a bucket named `event-recordings`
3. This will store camera snapshots and video clips from fire incidents

## Step 4: Create Your First Admin User

1. Go to **Authentication** > **Users** in Supabase dashboard
2. Click **Add User** > **Create new user**
3. Fill in:
   - **Email**: your.email@example.com
   - **Password**: Choose a strong password
   - **Auto Confirm User**: ✅ Check this
4. Click **Create user**

5. Now go to **SQL Editor** and run this query to make the user an Admin:

```sql
UPDATE users
SET role = 'Admin',
    full_name = 'Your Full Name'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'your.email@example.com'
);
```

## Step 5: Get Your API Credentials

1. Go to **Project Settings** > **API**
2. Copy these values:

   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGc...`)

3. Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 6: Test the Connection

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open your browser and navigate to the login page
4. Sign in with your admin credentials

## Database Tables Overview

| Table              | Purpose                               |
| ------------------ | ------------------------------------- |
| `users`            | User profiles (extends Supabase Auth) |
| `stations`         | BFP fire station information          |
| `devices`          | IoT devices (cameras and sensors)     |
| `sensor_readings`  | Time-series sensor data               |
| `incidents`        | Fire incident logs                    |
| `alerts`           | Alert notifications to responders     |
| `event_recordings` | Media files from incidents            |

## Important Notes

### Security

- RLS (Row Level Security) is enabled on all tables
- Only authenticated users can access data
- Admins have full CRUD access
- FireResponders have read access and can acknowledge alerts

### Performance

- Indexes are created on frequently queried columns
- `sensor_readings` table will grow large - consider partitioning in production

### Real-time Features

- Supabase Realtime is enabled for:
  - New alerts
  - Sensor readings updates
  - Device status changes

## Troubleshooting

### Can't log in?

- Verify user exists in **Authentication** > **Users**
- Check if user is confirmed
- Run the SQL query to ensure `users` table has the profile

### Data not showing?

- Check RLS policies in **Database** > **Policies**
- Verify your API credentials in `.env`
- Check browser console for errors

### Need to reset?

```sql
-- ⚠️ WARNING: This deletes ALL data
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then re-run schema.sql
```

## Next Steps

1. Configure IoT devices to send data to Supabase
2. Set up SMS alerts (Twilio integration)
3. Deploy to Vercel
4. Set up monitoring and backups
