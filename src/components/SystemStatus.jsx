import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

const SystemStatus = () => {
  const [status, setStatus] = useState({
    sensors: { status: "checking", count: 0 },
    cameras: { status: "checking", count: 0 },
    analytics: { status: "checking" },
    alerts: { status: "checking" },
  });

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Check sensors
      const { data: sensors, error: sensorsError } = await supabase
        .from("devices")
        .select("id, status")
        .eq("type", "sensor_hub");

      const onlineSensors =
        sensors?.filter((s) => s.status === "online").length || 0;

      // Check cameras
      const { data: cameras, error: camerasError } = await supabase
        .from("devices")
        .select("id, status")
        .eq("type", "camera");

      const onlineCameras =
        cameras?.filter((c) => c.status === "online").length || 0;

      setStatus({
        sensors: {
          status: sensorsError
            ? "error"
            : onlineSensors > 0
            ? "operational"
            : "warning",
          count: onlineSensors,
          total: sensors?.length || 0,
        },
        cameras: {
          status: camerasError
            ? "error"
            : onlineCameras > 0
            ? "operational"
            : "warning",
          count: onlineCameras,
          total: cameras?.length || 0,
        },
        analytics: {
          status: "operational", // This would check ML service status
        },
        alerts: {
          status: "operational", // This would check alert service status
        },
      });
    } catch (error) {
      console.error("Error checking system status:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
        System Status
      </h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.sensors.status)}
            <span className="text-sm text-slate-600 dark:text-slate-400">IoT Sensors</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {status.sensors.count}/{status.sensors.total} online
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.cameras.status)}
            <span className="text-sm text-slate-600 dark:text-slate-400">Cameras</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {status.cameras.count}/{status.cameras.total} online
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.analytics.status)}
            <span className="text-sm text-slate-600 dark:text-slate-400">Analytics</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.alerts.status)}
            <span className="text-sm text-slate-600 dark:text-slate-400">Alerts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
