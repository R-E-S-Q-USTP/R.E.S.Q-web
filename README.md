# R.E.S.Q. - Rapid Emergency Surveillance & Quenching

An IoT-based fire incident monitoring and early response system for Cagayan de Oro City.

## Features

- 🔥 Real-time fire detection using IoT sensors and ML-based image detection (YOLOv8)
- 📊 Live monitoring dashboard for fire authorities (BFP)
- 📹 Live camera feeds from ESP32-CAM devices
- 🚨 Instant SMS and web alerts
- 📍 Geographic incident tracking
- 📈 Analytics and reporting
- 👥 Role-based access control (Admin, FireResponder)

## Tech Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Deployment:** Vercel

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and add your Supabase credentials:

   ```
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Database Setup

Run the SQL scripts in `supabase/` folder in your Supabase SQL editor to create the necessary tables and policies.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── hooks/          # Custom React hooks
├── lib/            # Utilities and configurations
├── contexts/       # React contexts (Auth, etc.)
└── App.jsx         # Main app component
```

## Deployment

This project is optimized for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

## License

Proprietary - Cagayan de Oro City Fire Monitoring System
