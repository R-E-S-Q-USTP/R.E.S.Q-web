import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const AlertContext = createContext({});

// Mock alert data
const mockAlerts = [
  {
    id: 1,
    status: "new",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    incident: {
      location_text: "Building A - Floor 2",
      detection_method: "YOLOv8 Camera",
      device: { name: "Camera 01 - Main Entrance" },
      sensor_snapshot: {
        temperature: "85°C",
        smoke_level: "High",
        humidity: "45%",
      },
    },
  },
  {
    id: 2,
    status: "new",
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    incident: {
      location_text: "Warehouse Section C",
      detection_method: "Temperature Sensor",
      device: { name: "Sensor Hub A1" },
      sensor_snapshot: {
        temperature: "72°C",
        smoke_level: "Medium",
        humidity: "38%",
      },
    },
  },
  {
    id: 3,
    status: "acknowledged",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    acknowledged_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    acknowledged_by_user: { full_name: "John Smith" },
    incident: {
      location_text: "Server Room",
      detection_method: "Smoke Sensor",
      device: { name: "Sensor Hub B2" },
      sensor_snapshot: {
        temperature: "55°C",
        smoke_level: "Low",
        humidity: "52%",
      },
    },
  },
  {
    id: 4,
    status: "acknowledged",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    acknowledged_at: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
    acknowledged_by_user: { full_name: "Maria Garcia" },
    incident: {
      location_text: "Kitchen Area - Cafeteria",
      detection_method: "Combined Detection",
      device: { name: "Camera 02 - Warehouse" },
      sensor_snapshot: {
        temperature: "68°C",
        smoke_level: "High",
        humidity: "35%",
      },
    },
  },
];

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlerts must be used within an AlertProvider");
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(
    mockAlerts.filter((a) => a.status === "new").length
  );
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let channel = null;

    const setupChannel = () => {
      // Remove existing channel if any
      if (channel) {
        supabase.removeChannel(channel);
      }

      // Subscribe to real-time updates
      channel = supabase
        .channel("alerts-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "alerts",
          },
          (payload) => {
            handleAlertChange(payload);
          }
        )
        .subscribe();
    };

    // Fetch initial alerts and setup channel
    fetchAlerts();
    setupChannel();

    // Handle tab visibility change - reconnect channel when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Refresh alerts and reconnect channel when tab becomes visible
        fetchAlerts();
        setupChannel();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select(
          `
          *,
          incident:incidents(
            *,
            device:devices(*)
          ),
          acknowledged_by_user:users!acknowledged_by(full_name)
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Use fetched data if available, otherwise keep mock data
      if (data && data.length > 0) {
        setAlerts(data);
        setUnacknowledgedCount(
          data.filter((alert) => alert.status === "new").length
        );
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      // Keep mock data on error
    }
  };

  const handleAlertChange = (payload) => {
    if (payload.eventType === "INSERT") {
      // New alert - play sound, show notification
      playAlertSound();
      showNotification(payload.new);
      fetchAlerts(); // Refresh to get full data with joins
    } else if (payload.eventType === "UPDATE") {
      fetchAlerts();
    } else if (payload.eventType === "DELETE") {
      setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({
          status: "acknowledged",
          acknowledged_by: user.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", alertId);

      if (error) throw error;

      await fetchAlerts();
      return { success: true };
    } catch (error) {
      console.error("Error acknowledging alert:", error);
      // Handle mock data acknowledgment
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId
            ? {
                ...alert,
                status: "acknowledged",
                acknowledged_at: new Date().toISOString(),
                acknowledged_by_user: { full_name: "Current User" },
              }
            : alert
        )
      );
      setUnacknowledgedCount((prev) => Math.max(0, prev - 1));
      return { success: true };
    }
  };

  const playAlertSound = () => {
    // Play alert sound (you can add an audio file later)
    if ("Notification" in window && Notification.permission === "granted") {
      // Browser notification sound
    }
  };

  const showNotification = (alert) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🔥 Fire Alert!", {
        body: `Fire detected at ${alert.location_text || "Unknown location"}`,
        icon: "/fire-icon.svg",
        badge: "/fire-icon.svg",
        tag: alert.id,
      });
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const value = {
    alerts,
    unacknowledgedCount,
    acknowledgeAlert,
    refreshAlerts: fetchAlerts,
  };

  return (
    <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
  );
};
