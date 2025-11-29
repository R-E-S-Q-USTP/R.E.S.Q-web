import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { Radio, Circle, TrendingUp, MapPin, Clock } from "lucide-react";

const SensorsPage = () => {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSensors = async (isMounted = true) => {
    try {
      const { data: devices, error: devicesError } = await supabase
        .from("devices")
        .select("*")
        .eq("type", "sensor_hub")
        .order("name");

      if (devicesError) throw devicesError;

      // Fetch latest readings for each sensor
      const sensorsWithReadings = await Promise.all(
        (devices || []).map(async (device) => {
          const { data: readings } = await supabase
            .from("sensor_readings")
            .select("*")
            .eq("device_id", device.id)
            .order("created_at", { ascending: false })
            .limit(4);

          // Group readings by type
          const latestReadings = {};
          readings?.forEach((reading) => {
            if (!latestReadings[reading.reading_type]) {
              latestReadings[reading.reading_type] = reading;
            }
          });

          return {
            ...device,
            readings: latestReadings,
          };
        })
      );

      if (isMounted) {
        setSensors(sensorsWithReadings);
      }
    } catch (error) {
      console.error("Error fetching sensors:", error);
      if (isMounted) {
        setError(error.message || "Failed to load sensors");
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    setError(null);
    fetchSensors(isMounted);

    // Subscribe to real-time sensor updates
    const channel = supabase
      .channel("sensor-readings")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sensor_readings",
        },
        () => {
          fetchSensors(isMounted);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "offline":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const getSensorValueStatus = (type, value) => {
    // Define thresholds (these should match your IoT device thresholds)
    const thresholds = {
      smoke: { warning: 300, danger: 500 },
      heat: { warning: 50, danger: 70 },
      gas: { warning: 200, danger: 400 },
      flame: { warning: 0.5, danger: 0.8 },
    };

    const threshold = thresholds[type];
    if (!threshold || value === null || value === undefined) return "normal";

    if (value >= threshold.danger) return "danger";
    if (value >= threshold.warning) return "warning";
    return "normal";
  };

  const getValueColor = (status) => {
    switch (status) {
      case "danger":
        return "text-red-600 bg-red-50 border-red-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-green-600 bg-green-50 border-green-200";
    }
  };

  const getSensorIcon = (type) => {
    return <Radio className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Loading sensors...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            IoT Sensors
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Real-time monitoring of all fire detection sensors
          </p>
        </div>

        {sensors.length === 0 ? (
          <div className="card text-center py-12">
            <Radio className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">
              No sensors registered
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sensors.map((sensor) => (
              <div key={sensor.id} className="card">
                {/* Sensor Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        sensor.status === "online"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      <Radio
                        className={`w-6 h-6 ${getStatusColor(sensor.status)}`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {sensor.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{sensor.location_text}</span>
                      </div>
                    </div>
                  </div>
                  <Circle
                    className={`w-3 h-3 ${getStatusColor(
                      sensor.status
                    )} fill-current`}
                  />
                </div>

                {/* Sensor Readings */}
                <div className="space-y-3">
                  {["smoke", "heat", "gas", "flame"].map((type) => {
                    const reading = sensor.readings[type];
                    const value = reading?.value;
                    const status = getSensorValueStatus(type, value);

                    return (
                      <div
                        key={type}
                        className={`p-3 rounded-lg border ${getValueColor(
                          status
                        )}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize">
                            {type}
                          </span>
                          {reading && <Clock className="w-3 h-3 opacity-50" />}
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-bold">
                            {value !== null && value !== undefined
                              ? value.toFixed(1)
                              : "--"}
                          </span>
                          <span className="text-xs opacity-70">
                            {type === "heat"
                              ? "°C"
                              : type === "flame"
                              ? ""
                              : "ppm"}
                          </span>
                        </div>
                        {reading && (
                          <p className="text-xs opacity-70 mt-1">
                            {format(new Date(reading.created_at), "HH:mm:ss")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Last Heartbeat */}
                {sensor.last_heartbeat && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Last heartbeat:{" "}
                      {format(new Date(sensor.last_heartbeat), "PPp")}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SensorsPage;
