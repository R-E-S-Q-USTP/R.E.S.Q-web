/**
 * Alert Service for R.E.S.Q Fire Detection System
 * Handles device registration, incident creation, and alert management
 */

import { supabase } from "../lib/supabase";

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

    if (storedDeviceId) {
      // Verify device still exists in Supabase
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
        localStorage.removeItem(DEVICE_STORAGE_KEY);
        console.log(
          "⚠️ Stored device not found in database, registering new one..."
        );
      }
    }

    // Register new device
    const deviceName = generateDeviceName();

    const { data: newDevice, error: insertError } = await supabase
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
      .single();

    if (insertError) {
      console.error("❌ Error registering device:", insertError);
      return null;
    }

    // Store device ID in localStorage for persistence
    localStorage.setItem(DEVICE_STORAGE_KEY, newDevice.id);
    console.log("✅ Registered new ML camera device:", newDevice.name);

    return newDevice;
  } catch (error) {
    console.error("❌ Error in getOrRegisterDevice:", error);
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
    // Get device location
    const { data: device } = await supabase
      .from("devices")
      .select("location_text, lat, lng")
      .eq("id", deviceId)
      .single();

    const locationText = device?.location_text || DEFAULT_LOCATION.text;
    const lat = device?.lat || DEFAULT_LOCATION.lat;
    const lng = device?.lng || DEFAULT_LOCATION.lng;

    const { data: incident, error } = await supabase
      .from("incidents")
      .insert({
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
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating incident:", error);
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
    const { data: alert, error } = await supabase
      .from("alerts")
      .insert({
        incident_id: incidentId,
        status: "new",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating alert:", error);
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
