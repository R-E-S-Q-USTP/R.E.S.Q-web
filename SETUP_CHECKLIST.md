# R.E.S.Q. Setup Checklist

Use this checklist to get your R.E.S.Q. system up and running!

## ✅ Prerequisites

- [ ] Node.js 18.x or later installed
- [ ] npm or yarn installed
- [ ] Git installed (optional, for version control)
- [ ] A modern web browser (Chrome, Firefox, Edge)
- [ ] Internet connection

## 📦 Step 1: Project Setup

- [x] Dependencies installed (`npm install`) ✅ DONE
- [ ] Review project structure in PROJECT_SUMMARY.md
- [ ] Read QUICKSTART.md for overview

## 🗄️ Step 2: Supabase Setup

### Create Supabase Project

- [ ] Go to https://supabase.com and sign up/login
- [ ] Click "New Project"
- [ ] Name: "R.E.S.Q. Fire Monitoring"
- [ ] Choose strong database password
- [ ] Select region closest to Cagayan de Oro (Southeast Asia recommended)
- [ ] Wait for project to initialize (~2 minutes)

### Set Up Database

- [ ] Open supabase/README.md for detailed instructions
- [ ] Go to SQL Editor in Supabase dashboard
- [ ] Copy entire contents of supabase/schema.sql
- [ ] Paste and run in SQL Editor
- [ ] Verify tables were created (check Tables section)

### Get API Credentials

- [ ] Go to Project Settings > API in Supabase
- [ ] Copy "Project URL"
- [ ] Copy "anon/public key"
- [ ] Open .env file in project root
- [ ] Replace `your_supabase_url_here` with Project URL
- [ ] Replace `your_supabase_anon_key_here` with anon key
- [ ] Save .env file

### Create First Admin User

- [ ] Go to Authentication > Users in Supabase
- [ ] Click "Add User" > "Create new user"
- [ ] Email: your.email@example.com
- [ ] Password: (choose strong password)
- [ ] Check "Auto Confirm User"
- [ ] Click "Create user"
- [ ] Go to SQL Editor
- [ ] Run this query (replace email with yours):

```sql
UPDATE users
SET role = 'Admin',
    full_name = 'Your Full Name'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'your.email@example.com'
);
```

## 🚀 Step 3: Run the Application

- [ ] Open terminal in project directory
- [ ] Run `npm run dev`
- [ ] Browser should open to http://localhost:3000
- [ ] You should see the login page

## 🔐 Step 4: First Login

- [ ] On login page, check that "System Status" shows (may show offline for devices)
- [ ] Enter your admin email
- [ ] Enter your admin password
- [ ] Click "Sign In"
- [ ] You should be redirected to the dashboard
- [ ] Verify your name appears in top right corner

## 🧪 Step 5: Test Features

### Test Dashboard

- [ ] Dashboard loads without errors
- [ ] You see metrics (Active Sensors, System Uptime, etc.)
- [ ] "No active alerts" message appears (this is good!)
- [ ] Navigation bar is visible at top

### Test Navigation

- [ ] Click "Analytics" - page loads
- [ ] Click "Map" - page loads
- [ ] Click "Incidents" - page loads (should be empty)
- [ ] Click "Alerts" - page loads (should be empty)
- [ ] Click "Cameras" - page loads (should show "No cameras registered")
- [ ] Click "Sensors" - page loads (should show "No sensors registered")

### Test Admin Pages

- [ ] Click "Settings" - page loads
- [ ] You should see Users tab
- [ ] Your admin user should be listed
- [ ] Click "Maintenance" - page loads
- [ ] You should see device statistics (all zeros is normal)

### Test Logout

- [ ] Click logout button (top right)
- [ ] You should return to login page
- [ ] Try logging back in - should work

## 📊 Step 6: Add Test Data (Optional)

### Add a Fire Station

- [ ] Go to Settings > Stations tab
- [ ] (For now, stations are in database from schema.sql)
- [ ] Verify stations appear in dropdown when needed

### Add Test Devices

In Supabase dashboard, go to Table Editor > devices:

- [ ] Add a camera:
  - name: "TEST-CAM-01"
  - type: "camera"
  - location_text: "Test Location 1"
  - status: "offline"
- [ ] Add a sensor:
  - name: "TEST-SENSOR-01"
  - type: "sensor_hub"
  - location_text: "Test Location 2"
  - status: "offline"
- [ ] Refresh Cameras page - should see TEST-CAM-01
- [ ] Refresh Sensors page - should see TEST-SENSOR-01

### Create Test Alert (Optional)

Run in SQL Editor:

```sql
-- Create test incident
INSERT INTO incidents (location_text, detection_method, sensor_snapshot)
VALUES (
  'Test Location - Barangay Kauswagan',
  'Sensor',
  '{"smoke": 450, "heat": 65, "gas": 300, "flame": 0.7}'::jsonb
)
RETURNING id;

-- Copy the returned ID, then create alert (replace 'INCIDENT_ID' with actual ID)
INSERT INTO alerts (incident_id, status)
VALUES ('INCIDENT_ID', 'new');
```

- [ ] You should see a red alert banner at bottom of screen
- [ ] Click "View Alerts" button
- [ ] You should see the test alert
- [ ] Click "Acknowledge" button
- [ ] Alert should move to "Acknowledged Alerts" section

## 🎨 Step 7: Verify Features

- [ ] Real-time alerts work (test alert appeared automatically)
- [ ] Navigation works smoothly
- [ ] Pages load without errors
- [ ] Dashboard metrics display correctly
- [ ] User interface looks professional
- [ ] Mobile responsive (resize browser window)

## 📱 Step 8: Test Browser Notifications

- [ ] When prompted, allow browser notifications
- [ ] Create another test alert (using SQL above)
- [ ] You should get a browser notification
- [ ] Notification should show fire location

## 🔍 Step 9: Troubleshooting

If something doesn't work:

- [ ] Check browser console (F12) for errors
- [ ] Verify .env file has correct Supabase credentials
- [ ] Restart dev server (Ctrl+C, then `npm run dev`)
- [ ] Check Supabase dashboard > Logs for errors
- [ ] Review QUICKSTART.md troubleshooting section

## 📚 Step 10: Next Steps

You're ready to move forward! Now:

- [ ] Read ROADMAP.md for development priorities
- [ ] Review PROJECT_SUMMARY.md for complete overview
- [ ] Check DEPLOYMENT.md when ready to deploy
- [ ] Start IoT integration (highest priority)
- [ ] Set up ML model integration
- [ ] Configure SMS alerts

## 🎉 Congratulations!

If you've checked off all the items above, your R.E.S.Q. Fire Monitoring System is successfully set up and running!

### What You Have Now:

✅ Fully functional web application
✅ Complete database with security
✅ User authentication system
✅ Real-time alert system
✅ Professional dashboard
✅ Admin management tools

### What's Next:

🚀 Connect IoT devices (ESP32-CAM, sensors)
🚀 Integrate ML model (YOLOv8)
🚀 Set up SMS alerts
🚀 Deploy to production

---

## 📞 Need Help?

- **Setup Issues**: Check QUICKSTART.md
- **Database Issues**: Check supabase/README.md
- **Deployment**: Check DEPLOYMENT.md
- **Development Plan**: Check ROADMAP.md
- **Project Overview**: Check PROJECT_SUMMARY.md

**You're doing great! The foundation is solid. Now it's time to connect the IoT devices and bring this system to life!** 🔥🚒
