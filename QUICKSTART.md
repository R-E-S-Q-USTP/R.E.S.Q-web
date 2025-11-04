# Quick Start Guide

## Installation

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Set Up Environment Variables**

   Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your Supabase credentials.

3. **Set Up Supabase Database**

   Follow the instructions in `supabase/README.md` to:

   - Create a Supabase project
   - Run the database schema
   - Create your first admin user
   - Get your API credentials

4. **Start Development Server**

   ```bash
   npm run dev
   ```

   The app will open at `http://localhost:3000`

## First Login

Use the admin credentials you created in Supabase:

- Email: Your admin email
- Password: Your admin password

## Project Structure

```
R.E.S.Q-web/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout.jsx           # Main app layout with navigation
│   │   ├── ProtectedRoute.jsx   # Route guard for authentication
│   │   └── SystemStatus.jsx     # System status indicator
│   ├── contexts/         # React contexts
│   │   ├── AuthContext.jsx      # Authentication state
│   │   └── AlertContext.jsx     # Real-time alerts
│   ├── lib/              # Utilities
│   │   └── supabase.js          # Supabase client
│   ├── pages/            # Page components
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── CameraDashboardPage.jsx
│   │   ├── SensorsPage.jsx
│   │   ├── IncidentsPage.jsx
│   │   ├── AlertsPage.jsx
│   │   ├── MapPage.jsx
│   │   ├── AnalyticsPage.jsx
│   │   ├── SettingsPage.jsx
│   │   └── MaintenancePage.jsx
│   ├── App.jsx           # Main app with routing
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── supabase/             # Database files
│   ├── schema.sql               # Database schema
│   └── README.md                # Setup instructions
├── .env.example          # Environment variables template
├── DEPLOYMENT.md         # Deployment guide
├── ROADMAP.md            # Development roadmap
└── README.md             # Project documentation
```

## Key Features

### ✅ Implemented

- User authentication with role-based access
- Real-time fire alert system
- Dashboard with key metrics
- Sensor monitoring
- Camera dashboard
- Incident history
- Analytics
- Admin settings
- Device maintenance

### 🚧 To Be Implemented

- IoT device integration
- SMS alerts
- Live video streaming
- Interactive map
- Charts and visualizations
- PDF reports
- And more (see ROADMAP.md)

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Environment Variables

Required environment variables (add to `.env`):

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these from your Supabase project dashboard under **Settings > API**.

## User Roles

### FireResponder

- View dashboard and alerts
- Acknowledge alerts
- View incidents, sensors, cameras
- View analytics

### Admin

- All FireResponder permissions
- Manage users
- Manage stations
- Manage devices
- System configuration

## Common Tasks

### Add a New User (via Supabase Dashboard)

1. Go to **Authentication > Users**
2. Click **Add User**
3. Enter email and password
4. Auto-confirm the user
5. Go to **SQL Editor** and set their role:
   ```sql
   UPDATE users
   SET role = 'FireResponder', full_name = 'John Doe'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
   ```

### Add a New Device (via Supabase Dashboard)

Go to **Table Editor > devices** and insert:

- name: Device identifier (e.g., "KAUS-CAM-03")
- type: "camera" or "sensor_hub"
- location_text: Location description
- status: "offline" (will update when device connects)

### Create a Test Alert

Run this in **SQL Editor**:

```sql
-- Create incident
INSERT INTO incidents (device_id, location_text, detection_method)
VALUES (
  (SELECT id FROM devices LIMIT 1),
  'Test Location',
  'Sensor'
)
RETURNING id;

-- Create alert (use the incident id from above)
INSERT INTO alerts (incident_id, status)
VALUES ('incident_id_here', 'new');
```

## Troubleshooting

### "Missing Supabase credentials" error

- Make sure `.env` file exists
- Check that variables start with `VITE_`
- Restart the dev server after adding/changing `.env`

### Login not working

- Verify user exists in Supabase Auth
- Check that user is confirmed
- Verify profile exists in `users` table
- Check browser console for errors

### Real-time alerts not updating

- Check Supabase Realtime is enabled
- Verify WebSocket connection in Network tab
- Check RLS policies allow reading

### CSS not applying

- Make sure PostCSS and Tailwind are configured
- Restart dev server
- Check for syntax errors in CSS

## Support

For detailed guides:

- **Database Setup**: See `supabase/README.md`
- **Deployment**: See `DEPLOYMENT.md`
- **Roadmap**: See `ROADMAP.md`

## License

Proprietary - Cagayan de Oro City Fire Monitoring System

---

**Need Help?** Check the comprehensive guides in the documentation files or review the code comments.
