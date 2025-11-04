import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAlerts } from "../contexts/AlertContext";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import {
  Activity,
  Radio,
  Users,
  TrendingUp,
  Camera,
  Flame,
  MapPin,
  Clock,
} from "lucide-react";

const DashboardPage = () => {
  const { alerts, acknowledgeAlert } = useAlerts();
  const [stats, setStats] = useState({
    activeSensors: 0,
    systemUptime: "99.8%",
    responseTeam: 0,
    systemHealth: 95,
  });
  const [recentIncidents, setRecentIncidents] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch active sensors
      const { data: devices } = await supabase
        .from("devices")
        .select("id, status")
        .eq("status", "online");

      // Fetch active users (response team)
      const { data: users } = await supabase
        .from("users")
        .select("id")
        .eq("role", "FireResponder");

      // Fetch recent incidents
      const { data: incidents } = await supabase
        .from("incidents")
        .select(
          `
          *,
          device:devices(*),
          alerts(*)
        `
        )
        .order("detected_at", { ascending: false })
        .limit(5);

      setStats({
        activeSensors: devices?.length || 0,
        systemUptime: "99.8%",
        responseTeam: users?.length || 0,
        systemHealth: 95,
      });

      setRecentIncidents(incidents || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const handleAcknowledge = async (alertId) => {
    await acknowledgeAlert(alertId);
  };

  const unacknowledgedAlerts = alerts.filter((alert) => alert.status === "new");

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Real-time fire monitoring and incident overview
          </p>
        </div>

        {/* Summary Card */}
        <div className="card bg-gradient-to-br from-primary-600 to-primary-700 text-white">
          <h2 className="text-xl font-bold mb-6">R.E.S.Q. Fire Monitoring</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Radio className="w-5 h-5 opacity-80" />
                <span className="text-sm opacity-80">Active Sensors</span>
              </div>
              <p className="text-3xl font-bold">{stats.activeSensors}</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-5 h-5 opacity-80" />
                <span className="text-sm opacity-80">System Uptime</span>
              </div>
              <p className="text-3xl font-bold">{stats.systemUptime}</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 opacity-80" />
                <span className="text-sm opacity-80">Response Team</span>
              </div>
              <p className="text-3xl font-bold">{stats.responseTeam}</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 opacity-80" />
                <span className="text-sm opacity-80">System Health</span>
              </div>
              <p className="text-3xl font-bold">{stats.systemHealth}%</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Alerts */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Active Alerts
              </h2>
              <Link
                to="/alerts"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View All
              </Link>
            </div>

            {unacknowledgedAlerts.length === 0 ? (
              <div className="text-center py-12">
                <Flame className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No active alerts</p>
                <p className="text-sm text-slate-400 mt-1">
                  All systems operational
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {unacknowledgedAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-red-600 p-2 rounded-lg">
                        <Flame className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          Fire Detected
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-slate-600 mt-1">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {alert.incident?.location_text ||
                              "Unknown Location"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(new Date(alert.created_at), "PPp")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="btn btn-danger text-sm"
                    >
                      Acknowledge
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Live Camera Feed Preview */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Live Cameras</h3>
                <Link
                  to="/cameras"
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  View All
                </Link>
              </div>
              <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden mb-3">
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-12 h-12 text-slate-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600 text-center">
                Camera feeds available on dedicated page
              </p>
            </div>

            {/* System Status */}
            <div className="card">
              <h3 className="font-semibold text-slate-900 mb-4">
                System Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">IoT Network</span>
                  <span className="badge badge-success">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">ML Analytics</span>
                  <span className="badge badge-success">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Alert System</span>
                  <span className="badge badge-success">Operational</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Database</span>
                  <span className="badge badge-success">Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Recent Incidents
            </h2>
            <Link
              to="/incidents"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View All
            </Link>
          </div>

          {recentIncidents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No recent incidents</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Detection Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentIncidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {incident.location_text}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {incident.detection_method}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {format(new Date(incident.detected_at), "PPp")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`badge ${
                            incident.alerts?.[0]?.status === "acknowledged"
                              ? "badge-success"
                              : "badge-danger"
                          }`}
                        >
                          {incident.alerts?.[0]?.status || "new"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
