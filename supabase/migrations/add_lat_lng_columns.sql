-- SQL Migration: Add lat/lng columns to devices and incidents tables
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Add lat/lng columns to devices table
ALTER TABLE devices 
ADD COLUMN IF NOT EXISTS lat REAL,
ADD COLUMN IF NOT EXISTS lng REAL;

-- Add lat/lng columns to incidents table
ALTER TABLE incidents 
ADD COLUMN IF NOT EXISTS lat REAL,
ADD COLUMN IF NOT EXISTS lng REAL;

-- Optional: Set default location (USTP CDO Campus) for existing devices without coordinates
UPDATE devices 
SET lat = 8.4857, lng = 124.6565 
WHERE lat IS NULL OR lng IS NULL;

-- Optional: Set default location for existing incidents without coordinates
UPDATE incidents 
SET lat = 8.4857, lng = 124.6565 
WHERE lat IS NULL OR lng IS NULL;

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'devices' AND column_name IN ('lat', 'lng');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'incidents' AND column_name IN ('lat', 'lng');

-- ============================================================
-- IMPORTANT: After running this migration, the ML fire detection
-- system will be able to:
-- 1. Auto-register webcam devices with location coordinates
-- 2. Create incidents with lat/lng for map pinning
-- 3. Display fire detection alerts on the map component
-- ============================================================
