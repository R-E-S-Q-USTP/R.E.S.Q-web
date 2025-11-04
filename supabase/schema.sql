-- R.E.S.Q. Fire Monitoring System - Supabase Database Schema
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Stations Table
CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'FireResponder' CHECK (role IN ('Admin', 'FireResponder')),
  station_id UUID REFERENCES stations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices Table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('camera', 'sensor_hub')),
  location_text TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance')),
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sensor Readings Table (Time-series data)
CREATE TABLE IF NOT EXISTS sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reading_type TEXT NOT NULL CHECK (reading_type IN ('smoke', 'heat', 'gas', 'flame')),
  value REAL NOT NULL
);

-- Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  location_text TEXT,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  detection_method TEXT CHECK (detection_method IN ('YOLOv8', 'Sensor', 'Combined')),
  sensor_snapshot JSONB
);

-- Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged')),
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ
);

-- Event Recordings Table
CREATE TABLE IF NOT EXISTS event_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'video_clip')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Sensor readings are high-volume, need efficient queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_id ON sensor_readings(device_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_created_at ON sensor_readings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_type ON sensor_readings(reading_type);

-- Incidents queries
CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON incidents(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_device_id ON incidents(device_id);

-- Alerts queries
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_incident_id ON alerts(incident_id);

-- Devices queries
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_recordings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Admin'
    )
  );

-- Stations policies
CREATE POLICY "All authenticated users can read stations"
  ON stations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage stations"
  ON stations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Admin'
    )
  );

-- Devices policies
CREATE POLICY "All authenticated users can read devices"
  ON devices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage devices"
  ON devices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Admin'
    )
  );

-- Sensor readings policies
CREATE POLICY "All authenticated users can read sensor readings"
  ON sensor_readings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "IoT devices can insert sensor readings"
  ON sensor_readings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Incidents policies
CREATE POLICY "All authenticated users can read incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create incidents"
  ON incidents FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Alerts policies
CREATE POLICY "All authenticated users can read alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can update alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "System can create alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Event recordings policies
CREATE POLICY "All authenticated users can read event recordings"
  ON event_recordings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create event recordings"
  ON event_recordings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'FireResponder')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SEED DATA (Optional - for testing)
-- =====================================================

-- Insert a test station
INSERT INTO stations (name, location_text) VALUES
  ('Cagayan de Oro Central Fire Station', 'Barangay Kauswagan'),
  ('Carmen Fire Station', 'Barangay Carmen')
ON CONFLICT DO NOTHING;

-- Note: Users will be created through Supabase Auth
-- You can create test users in the Supabase dashboard

-- Insert test devices
INSERT INTO devices (name, type, location_text, status) VALUES
  ('KAUS-CAM-01', 'camera', 'Barangay Kauswagan, Zone 1', 'offline'),
  ('KAUS-CAM-02', 'camera', 'Barangay Kauswagan, Zone 2', 'offline'),
  ('KAUS-SENSOR-01', 'sensor_hub', 'Barangay 24, Zone 1', 'offline'),
  ('KAUS-SENSOR-02', 'sensor_hub', 'Barangay 25, Zone 2', 'offline'),
  ('CARM-CAM-01', 'camera', 'Barangay Carmen, Main St', 'offline'),
  ('CARM-SENSOR-01', 'sensor_hub', 'Barangay Carmen, Market Area', 'offline')
ON CONFLICT DO NOTHING;

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- Run this in the Supabase Storage section or via SQL:

-- Create storage bucket for event recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-recordings', 'event-recordings', false)
ON CONFLICT DO NOTHING;

-- Storage policy: Allow authenticated users to read recordings
CREATE POLICY "Authenticated users can read event recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'event-recordings');

-- Storage policy: Allow system to upload recordings
CREATE POLICY "System can upload event recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-recordings');
