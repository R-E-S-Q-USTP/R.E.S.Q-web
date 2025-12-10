/**
 * Alert Service for R.E.S.Q Fire Detection System
 * Handles device registration, incident creation, and alert management
 */

import { supabase } from "../lib/supabase";

// Supabase REST API config (direct fetch as fallback)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Direct REST API call to Supabase (bypasses JS client)
 */
const supabaseRest = async (table, method, body = null) => {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const options = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase REST error: ${response.status} - ${error}`);
  }
  return response.json();
};

// Default location: USTP CDO Campus
export const DEFAULT_LOCATION = {
  lat: 8.4857,
  lng: 124.6565,
  text: "USTP CDO Campus",
};

// Alert cooldown period (30 seconds)
export const ALERT_COOLDOWN_MS = 30000;

// LocalStorage key for device ID persistence
const DEVICE_STORAGE_KEY = "resq_ml_device_id";

// Timeout for Supabase operations (15 seconds)
const SUPABASE_TIMEOUT_MS = 15000;

/**
 * Wrap a promise with a timeout
 */
const withTimeout = (promise, ms = SUPABASE_TIMEOUT_MS) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${ms}ms`)),
        ms
      )
    ),
  ]);
};

/**
 * Generate a unique device name
 * Format: ML-CAM-[6-char-UUID]-[timestamp]
 */
const generateDeviceName = () => {
  const uuid = crypto.randomUUID().substring(0, 6).toUpperCase();
  const timestamp = Math.floor(Date.now() / 1000);
  return `ML-CAM-${uuid}-${timestamp}`;
};

/**
 * Get or register an ML camera device
 * Checks localStorage first, registers new device if not found
 * @returns {Promise<{id: string, name: string} | null>}
 */
export const getOrRegisterDevice = async () => {
  try {
    // Check localStorage for existing device ID
    const storedDeviceId = localStorage.getItem(DEVICE_STORAGE_KEY);
    console.log(
      "🔍 Checking localStorage for device ID:",
      storedDeviceId || "none"
    );

    if (storedDeviceId) {
      // Verify device still exists in Supabase
      console.log("🔍 Verifying device exists in Supabase...");
      const { data: existingDevice, error } = await supabase
        .from("devices")
        .select("id, name, location_text, lat, lng")
        .eq("id", storedDeviceId)
        .single();

      if (!error && existingDevice) {
        console.log("📷 Using existing ML camera device:", existingDevice.name);

        // Update last_heartbeat
        await supabase
          .from("devices")
          .update({
            status: "online",
            last_heartbeat: new Date().toISOString(),
          })
          .eq("id", storedDeviceId);

        return existingDevice;
      } else {
        // Device not found in DB, clear localStorage
        console.log(
          "⚠️ Device lookup error:",
          error?.message || "device not found"
        );
        localStorage.removeItem(DEVICE_STORAGE_KEY);
        console.log(
          "⚠️ Stored device not found in database, registering new one..."
        );
      }
    }

    // Register new device
    const deviceName = generateDeviceName();
    console.log("📝 Registering new device:", deviceName);

    const { data: newDevice, error: insertError } = await withTimeout(
      supabase
        .from("devices")
        .insert({
          name: deviceName,
          type: "camera",
          location_text: DEFAULT_LOCATION.text,
          lat: DEFAULT_LOCATION.lat,
          lng: DEFAULT_LOCATION.lng,
          status: "online",
          last_heartbeat: new Date().toISOString(),
        })
        .select()
        .single()
    );

    if (insertError) {
      console.error("❌ Error registering device:", insertError);
      console.error("❌ Error details:", JSON.stringify(insertError, null, 2));
      return null;
    }

    // Store device ID in localStorage for persistence
    localStorage.setItem(DEVICE_STORAGE_KEY, newDevice.id);
    console.log(
      "✅ Registered new ML camera device:",
      newDevice.name,
      "ID:",
      newDevice.id
    );

    return newDevice;
  } catch (error) {
    console.error("❌ Error in getOrRegisterDevice:", error);
    console.error("❌ Stack:", error.stack);
    return null;
  }
};

/**
 * Create a fire incident in Supabase
 * @param {string} deviceId - The device ID that detected the fire
 * @param {object} detectionData - Detection result from ML backend
 * @returns {Promise<{id: string} | null>}
 */
export const createIncident = async (deviceId, detectionData) => {
  try {
    console.log("📝 Creating incident for device:", deviceId);

    // Use default location to skip device lookup (faster)
    const locationText = DEFAULT_LOCATION.text;
    const lat = DEFAULT_LOCATION.lat;
    const lng = DEFAULT_LOCATION.lng;

    const incidentData = {
      device_id: deviceId,
      location_text: locationText,
      lat: lat,
      lng: lng,
      detection_method: "YOLOv8",
      detected_at: new Date().toISOString(),
      sensor_snapshot: {
        confidence: detectionData.highestConfidence,
        detections: detectionData.detections,
        threshold: detectionData.threshold,
        timestamp: detectionData.timestamp,
      },
    };

    console.log("📝 Inserting incident via REST API...");

    // Use direct REST API instead of Supabase client
    const incidents = await supabaseRest("incidents", "POST", incidentData);
    const incident = incidents[0];

    if (!incident) {
      console.error("❌ No incident returned from API");
      return null;
    }

    console.log("🔥 Incident created:", incident.id);
    return incident;
  } catch (error) {
    console.error("❌ Error in createIncident:", error);
    return null;
  }
};

/**
 * Create an alert for an incident
 * @param {string} incidentId - The incident ID to create alert for
 * @returns {Promise<{id: string} | null>}
 */
export const createAlert = async (incidentId) => {
  try {
    console.log("📝 Creating alert for incident:", incidentId);

    const alertData = {
      incident_id: incidentId,
      status: "new",
      created_at: new Date().toISOString(),
    };

    // Use direct REST API instead of Supabase client
    const alerts = await supabaseRest("alerts", "POST", alertData);
    const alert = alerts[0];

    if (!alert) {
      console.error("❌ No alert returned from API");
      return null;
    }

    console.log("🚨 Alert created:", alert.id);
    return alert;
  } catch (error) {
    console.error("❌ Error in createAlert:", error);
    return null;
  }
};

/**
 * Create both incident and alert in one call
 * @param {string} deviceId - The device ID that detected the fire
 * @param {object} detectionData - Detection result from ML backend
 * @returns {Promise<{incident: object, alert: object} | null>}
 */
export const createFireAlert = async (deviceId, detectionData) => {
  const incident = await createIncident(deviceId, detectionData);
  if (!incident) return null;

  const alert = await createAlert(incident.id);
  if (!alert) return { incident, alert: null };

  return { incident, alert };
};

/**
 * Update device status
 * @param {string} deviceId - The device ID to update
 * @param {string} status - New status ('online', 'offline', 'maintenance')
 */
export const updateDeviceStatus = async (deviceId, status) => {
  try {
    const { error } = await supabase
      .from("devices")
      .update({
        status: status,
        last_heartbeat: new Date().toISOString(),
      })
      .eq("id", deviceId);

    if (error) {
      console.error("❌ Error updating device status:", error);
    }
  } catch (error) {
    console.error("❌ Error in updateDeviceStatus:", error);
  }
};

/**
 * Set device offline when webcam stops
 * @param {string} deviceId - The device ID to set offline
 */
export const setDeviceOffline = async (deviceId) => {
  if (!deviceId) return;
  await updateDeviceStatus(deviceId, "offline");
};

export default {
  DEFAULT_LOCATION,
  ALERT_COOLDOWN_MS,
  getOrRegisterDevice,
  createIncident,
  createAlert,
  createFireAlert,
  updateDeviceStatus,
  setDeviceOffline,
};
