import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseRest } from "../lib/supabase";
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
 * Fetch incidents with device and alert relations using REST API
 */
const fetchIncidentsWithRelations = async () => {
  try {
    console.log("📡 Fetching incidents via REST API...");

    // Fetch incidents with embedded relations
    const incidents = await supabaseRest(
      "incidents?select=*,device:devices(*),alerts(*)&order=detected_at.desc"
    );

    console.log("✅ Incidents fetched:", incidents.length);
    return incidents || [];
  } catch (err) {
    console.error("❌ Incidents fetch error:", err);
    return [];
  }
};

/**
 * Hook for fetching incidents with caching
 */
export const useIncidents = () => {
  return useQuery({
    queryKey: queryKeys.incidentsWithRelations,
    queryFn: fetchIncidentsWithRelations,
    staleTime: STALE_TIME.incidents,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};

/**
 * Fetch sensors with their latest readings using REST API
 */
const fetchSensorsWithReadings = async () => {
  try {
    console.log("📡 Fetching sensors via REST API...");

    // Fetch sensor hub devices
    const devices = await supabaseRest("devices?type=eq.sensor_hub&order=name");

    if (!devices || devices.length === 0) {
      console.log("📡 No sensor devices found");
      return [];
    }

    // Fetch sensor readings
    const deviceIds = devices.map((d) => d.id);
    const readings = await supabaseRest(
      `sensor_readings?device_id=in.(${deviceIds.join(
        ","
      )})&order=created_at.desc`
    );

    // Group readings by device and type
    const readingsByDevice = {};
    (readings || []).forEach((reading) => {
      if (!readingsByDevice[reading.device_id]) {
        readingsByDevice[reading.device_id] = {};
      }
      if (!readingsByDevice[reading.device_id][reading.reading_type]) {
        readingsByDevice[reading.device_id][reading.reading_type] = reading;
      }
    });

    // Combine devices with their readings
    const result = devices.map((device) => ({
      ...device,
      readings: readingsByDevice[device.id] || {},
    }));

    console.log("✅ Sensors fetched:", result.length);
    return result;
  } catch (err) {
    console.error("❌ Sensors fetch error:", err);
    return [];
  }
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
 * Fetch all analytics data using REST API
 */
const fetchAnalyticsData = async () => {
  try {
    console.log("📡 Fetching analytics via REST API...");

    const now = new Date();
    const sevenDaysAgo = subDays(now, 7).toISOString();
    const thirtyDaysAgo = subDays(now, 30).toISOString();

    // Fetch incidents for analytics
    const incidents = await supabaseRest(
      `incidents?select=id,location_text,detection_method,detected_at&detected_at=gte.${thirtyDaysAgo}&order=detected_at.desc`
    );

    // Fetch acknowledged alerts for response time
    const alerts = await supabaseRest(
      "alerts?select=created_at,acknowledged_at&acknowledged_at=not.is.null&limit=100"
    );

    // Calculate stats
    const totalIncidents = incidents?.length || 0;
    const last7Days =
      incidents?.filter(
        (i) => new Date(i.detected_at) >= new Date(sevenDaysAgo)
      ).length || 0;
    const last30Days = totalIncidents;

    // Calculate most active location
    const locationCounts = {};
    (incidents || []).forEach((incident) => {
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

      const count = (incidents || []).filter((inc) => {
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
    (incidents || []).forEach((incident) => {
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
    if (alerts && alerts.length > 0) {
      const totalMs = alerts.reduce((sum, alert) => {
        const created = new Date(alert.created_at);
        const acknowledged = new Date(alert.acknowledged_at);
        return sum + (acknowledged - created);
      }, 0);
      const avgMs = totalMs / alerts.length;
      const avgMinutes = Math.round((avgMs / 60000) * 10) / 10;
      avgResponseTime =
        avgMinutes < 60
          ? `${avgMinutes} min`
          : `${Math.round((avgMinutes / 60) * 10) / 10} hr`;
    }

    console.log("✅ Analytics fetched - Total incidents:", totalIncidents);

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
  } catch (err) {
    console.error("❌ Analytics fetch error:", err);
    return {
      stats: {
        totalIncidents: 0,
        last7Days: 0,
        last30Days: 0,
        avgResponseTime: "N/A",
        mostActiveLocation: "N/A",
      },
      incidentsOverTime: [],
      detectionMethods: [],
      activeLocations: [],
    };
  }
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
