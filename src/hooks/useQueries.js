import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { subDays, startOfDay } from "date-fns";

// Query keys for cache management
export const queryKeys = {
  incidents: ["incidents"],
  incidentsWithRelations: ["incidents", "with-relations"],
  sensors: ["sensors"],
  analytics: ["analytics"],
};

// Cache times (in milliseconds)
const STALE_TIME = {
  incidents: 60 * 1000, // 60 seconds
  sensors: 30 * 1000, // 30 seconds
  analytics: 60 * 1000, // 60 seconds
};

/**
 * Fetch incidents with device and alert relations
 */
const fetchIncidentsWithRelations = async () => {
  const { data, error } = await supabase
    .from("incidents")
    .select(
      `
      *,
      device:devices(*),
      alerts(
        *,
        acknowledged_by_user:users!acknowledged_by(full_name)
      )
    `
    )
    .order("detected_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Hook for fetching incidents with caching
 */
export const useIncidents = () => {
  return useQuery({
    queryKey: queryKeys.incidentsWithRelations,
    queryFn: fetchIncidentsWithRelations,
    staleTime: STALE_TIME.incidents,
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Fetch sensors with their latest readings (optimized - single query for readings)
 */
const fetchSensorsWithReadings = async () => {
  // First get all sensor hub devices
  const { data: devices, error: devicesError } = await supabase
    .from("devices")
    .select("*")
    .eq("type", "sensor_hub")
    .order("name");

  if (devicesError) throw devicesError;
  if (!devices || devices.length === 0) return [];

  // Get device IDs
  const deviceIds = devices.map((d) => d.id);

  // Fetch ALL sensor readings for all devices in ONE query (fixes N+1)
  const { data: allReadings, error: readingsError } = await supabase
    .from("sensor_readings")
    .select("*")
    .in("device_id", deviceIds)
    .order("created_at", { ascending: false });

  if (readingsError) {
    console.warn("Error fetching sensor readings:", readingsError);
  }

  // Group readings by device and type
  const readingsByDevice = {};
  (allReadings || []).forEach((reading) => {
    if (!readingsByDevice[reading.device_id]) {
      readingsByDevice[reading.device_id] = {};
    }
    // Keep only the latest reading per type
    if (!readingsByDevice[reading.device_id][reading.reading_type]) {
      readingsByDevice[reading.device_id][reading.reading_type] = reading;
    }
  });

  // Combine devices with their readings
  return devices.map((device) => ({
    ...device,
    readings: readingsByDevice[device.id] || {},
  }));
};

/**
 * Hook for fetching sensors with caching
 */
export const useSensors = () => {
  return useQuery({
    queryKey: queryKeys.sensors,
    queryFn: fetchSensorsWithReadings,
    staleTime: STALE_TIME.sensors,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Fetch all analytics data in parallel
 */
const fetchAnalyticsData = async () => {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7).toISOString();
  const thirtyDaysAgo = subDays(now, 30).toISOString();

  // Run all queries in parallel for better performance
  const [
    totalIncidentsResult,
    last7DaysResult,
    last30DaysResult,
    incidentsResult,
    alertsResult,
  ] = await Promise.all([
    // Total incidents count
    supabase.from("incidents").select("*", { count: "exact", head: true }),
    // Last 7 days count
    supabase
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .gte("detected_at", sevenDaysAgo),
    // Last 30 days count
    supabase
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .gte("detected_at", thirtyDaysAgo),
    // Incidents data for charts
    supabase
      .from("incidents")
      .select("location_text, detection_method, detected_at")
      .gte("detected_at", thirtyDaysAgo)
      .order("detected_at", { ascending: false }),
    // Alerts for response time calculation
    supabase
      .from("alerts")
      .select("created_at, acknowledged_at")
      .not("acknowledged_at", "is", null)
      .limit(100),
  ]);

  // Extract data with error handling
  const totalIncidents = totalIncidentsResult.error
    ? 0
    : totalIncidentsResult.count || 0;
  const last7Days = last7DaysResult.error ? 0 : last7DaysResult.count || 0;
  const last30Days = last30DaysResult.error ? 0 : last30DaysResult.count || 0;
  const incidents = incidentsResult.error ? [] : incidentsResult.data || [];
  const alertsData = alertsResult.error ? [] : alertsResult.data || [];

  // Calculate most active location
  const locationCounts = {};
  incidents.forEach((incident) => {
    const loc = incident.location_text || "Unknown";
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  });

  const mostActiveLocation =
    Object.keys(locationCounts).length > 0
      ? Object.keys(locationCounts).reduce((a, b) =>
          locationCounts[a] > locationCounts[b] ? a : b
        )
      : "N/A";

  // Calculate incidents over time (last 7 days)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const incidentsOverTime = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(now, i);
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const count = incidents.filter((inc) => {
      const incDate = new Date(inc.detected_at);
      return incDate >= dayStart && incDate < dayEnd;
    }).length;

    incidentsOverTime.push({
      name: dayNames[date.getDay()],
      incidents: count,
    });
  }

  // Calculate detection methods distribution
  const methodCounts = {};
  incidents.forEach((incident) => {
    const method = incident.detection_method || "Unknown";
    methodCounts[method] = (methodCounts[method] || 0) + 1;
  });

  const DETECTION_COLORS = {
    YOLOv8: "#3b82f6",
    Sensor: "#ef4444",
    Combined: "#22c55e",
    Unknown: "#6b7280",
  };

  const detectionMethods = Object.entries(methodCounts).map(
    ([name, value]) => ({
      name,
      value,
      color: DETECTION_COLORS[name] || DETECTION_COLORS.Unknown,
    })
  );

  // Calculate active locations (top 5)
  const activeLocations = Object.entries(locationCounts)
    .map(([location, incidents]) => ({ location, incidents }))
    .sort((a, b) => b.incidents - a.incidents)
    .slice(0, 5);

  // Calculate average response time
  let avgResponseTime = "N/A";
  if (alertsData.length > 0) {
    const totalMs = alertsData.reduce((sum, alert) => {
      const created = new Date(alert.created_at);
      const acknowledged = new Date(alert.acknowledged_at);
      return sum + (acknowledged - created);
    }, 0);
    const avgMs = totalMs / alertsData.length;
    const avgMinutes = Math.round((avgMs / 60000) * 10) / 10;
    avgResponseTime =
      avgMinutes < 60
        ? `${avgMinutes} min`
        : `${Math.round((avgMinutes / 60) * 10) / 10} hr`;
  }

  return {
    stats: {
      totalIncidents,
      last7Days,
      last30Days,
      avgResponseTime,
      mostActiveLocation,
    },
    incidentsOverTime,
    detectionMethods,
    activeLocations,
  };
};

/**
 * Hook for fetching analytics with caching
 */
export const useAnalytics = () => {
  return useQuery({
    queryKey: queryKeys.analytics,
    queryFn: fetchAnalyticsData,
    staleTime: STALE_TIME.analytics,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to invalidate queries (for real-time updates)
 */
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return {
    invalidateIncidents: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.incidents }),
    invalidateSensors: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.sensors }),
    invalidateAnalytics: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
};
