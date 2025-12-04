import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const AlertContext = createContext({});

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlerts must be used within an AlertProvider");
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
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

      // Use real data only - no mock fallback
      setAlerts(data || []);
      setUnacknowledgedCount(
        (data || []).filter((alert) => alert.status === "new").length
      );
    } catch (error) {
      console.error("Error fetching alerts:", error);
      // Set empty state on error - no mock data
      setAlerts([]);
      setUnacknowledgedCount(0);
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
      return { success: false, error: error.message };
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
