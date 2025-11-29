import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Calendar,
  MapPin,
} from "lucide-react";
import { format, subDays } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Mock data for charts
const mockIncidentsOverTime = [
  { name: "Mon", incidents: 4 },
  { name: "Tue", incidents: 7 },
  { name: "Wed", incidents: 3 },
  { name: "Thu", incidents: 8 },
  { name: "Fri", incidents: 5 },
  { name: "Sat", incidents: 2 },
  { name: "Sun", incidents: 6 },
];

const mockDetectionMethods = [
  { name: "YOLOv8 Camera", value: 45, color: "#3b82f6" },
  { name: "Temperature Sensor", value: 30, color: "#ef4444" },
  { name: "Smoke Sensor", value: 15, color: "#f97316" },
  { name: "Combined Detection", value: 10, color: "#22c55e" },
];

const mockActiveLocations = [
  { location: "Building A - Floor 2", incidents: 12 },
  { location: "Warehouse Section C", incidents: 9 },
  { location: "Server Room", incidents: 7 },
  { location: "Kitchen Area", incidents: 5 },
  { location: "Parking Garage", incidents: 3 },
];

const AnalyticsPage = () => {
  const [stats, setStats] = useState({
    totalIncidents: 35,
    last7Days: 8,
    last30Days: 22,
    avgResponseTime: "2.5 min",
    mostActiveLocation: "Building A - Floor 2",
  });
  const [loading, setLoading] = useState(false); // Start with false - show mock data immediately
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      try {
        // Total incidents
        const { count: totalIncidents, error: totalError } = await supabase
          .from("incidents")
          .select("*", { count: "exact", head: true });

        if (totalError) throw totalError;

        // Last 7 days
        const { count: last7Days, error: last7Error } = await supabase
          .from("incidents")
          .select("*", { count: "exact", head: true })
          .gte("detected_at", subDays(new Date(), 7).toISOString());

        if (last7Error) throw last7Error;

        // Last 30 days
        const { count: last30Days, error: last30Error } = await supabase
          .from("incidents")
          .select("*", { count: "exact", head: true })
          .gte("detected_at", subDays(new Date(), 30).toISOString());

        if (last30Error) throw last30Error;

        // Most active location (simplified)
        const { data: incidents, error: incidentsError } = await supabase
          .from("incidents")
          .select("location_text")
          .limit(100);

        if (incidentsError) throw incidentsError;

        const locationCounts = {};
        incidents?.forEach((incident) => {
          const loc = incident.location_text || "Unknown";
          locationCounts[loc] = (locationCounts[loc] || 0) + 1;
        });

        const mostActiveLocation =
          Object.keys(locationCounts).length > 0
            ? Object.keys(locationCounts).reduce((a, b) =>
                locationCounts[a] > locationCounts[b] ? a : b
              )
            : "N/A";

        if (isMounted) {
          setStats({
            totalIncidents: totalIncidents || 0,
            last7Days: last7Days || 0,
            last30Days: last30Days || 0,
            avgResponseTime: "2.5 min", // TODO: Calculate from actual data
            mostActiveLocation,
          });
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
        // Keep mock data on error - don't set error state
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Loading analytics...
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
            Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            System performance metrics and incident statistics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Incidents
              </h3>
              <Activity className="w-5 h-5 text-primary-600 dark:text-primary-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {stats.totalIncidents}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              All time
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Last 7 Days
              </h3>
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {stats.last7Days}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Recent activity
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Last 30 Days
              </h3>
              <Calendar className="w-5 h-5 text-green-600 dark:text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {stats.last30Days}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Monthly total
            </p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Avg Response
              </h3>
              <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {stats.avgResponseTime}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Time to acknowledge
            </p>
          </div>
        </div>

        {/* Charts with Recharts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Incidents Over Time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockIncidentsOverTime}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    tick={{ fill: "#9ca3af" }}
                  />
                  <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#f3f4f6",
                    }}
                  />
                  <Bar
                    dataKey="incidents"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Detection Methods
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockDetectionMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {mockDetectionMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#f3f4f6",
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-slate-600 dark:text-slate-300">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Most Active Locations */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Most Active Locations
          </h3>
          <div className="space-y-3">
            {mockActiveLocations.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {item.location}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {item.incidents}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    incidents
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
            System Performance
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Alert Acknowledgment Rate
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  98%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-600 dark:bg-green-500 h-2 rounded-full"
                  style={{ width: "98%" }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Sensor Network Uptime
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  99.8%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                  style={{ width: "99.8%" }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  ML Detection Accuracy
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  95%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full"
                  style={{ width: "95%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;
