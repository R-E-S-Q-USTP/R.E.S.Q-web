import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import { BarChart3, TrendingUp, Activity, Calendar } from "lucide-react";
import { format, subDays } from "date-fns";

const AnalyticsPage = () => {
  const [stats, setStats] = useState({
    totalIncidents: 0,
    last7Days: 0,
    last30Days: 0,
    avgResponseTime: "0 min",
    mostActiveLocation: "N/A",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Total incidents
      const { count: totalIncidents } = await supabase
        .from("incidents")
        .select("*", { count: "exact", head: true });

      // Last 7 days
      const { count: last7Days } = await supabase
        .from("incidents")
        .select("*", { count: "exact", head: true })
        .gte("detected_at", subDays(new Date(), 7).toISOString());

      // Last 30 days
      const { count: last30Days } = await supabase
        .from("incidents")
        .select("*", { count: "exact", head: true })
        .gte("detected_at", subDays(new Date(), 30).toISOString());

      // Most active location (simplified)
      const { data: incidents } = await supabase
        .from("incidents")
        .select("location_text")
        .limit(100);

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

      setStats({
        totalIncidents: totalIncidents || 0,
        last7Days: last7Days || 0,
        last30Days: last30Days || 0,
        avgResponseTime: "2.5 min", // TODO: Calculate from actual data
        mostActiveLocation,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-slate-600">Loading analytics...</p>
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
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-600 mt-1">
            System performance metrics and incident statistics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">
                Total Incidents
              </h3>
              <Activity className="w-5 h-5 text-primary-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {stats.totalIncidents}
            </p>
            <p className="text-xs text-slate-500 mt-1">All time</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">
                Last 7 Days
              </h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {stats.last7Days}
            </p>
            <p className="text-xs text-slate-500 mt-1">Recent activity</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">
                Last 30 Days
              </h3>
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {stats.last30Days}
            </p>
            <p className="text-xs text-slate-500 mt-1">Monthly total</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-600">
                Avg Response
              </h3>
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {stats.avgResponseTime}
            </p>
            <p className="text-xs text-slate-500 mt-1">Time to acknowledge</p>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">
              Incidents Over Time
            </h3>
            <div className="aspect-[2/1] bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  Chart: Line or bar chart showing incident trends
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-900 mb-4">
              Detection Methods
            </h3>
            <div className="aspect-[2/1] bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  Chart: Pie chart showing YOLOv8 vs Sensor vs Combined
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Most Active Location */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">
            Most Active Location
          </h3>
          <div className="text-center py-8">
            <p className="text-4xl font-bold text-primary-600">
              {stats.mostActiveLocation}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Location with the highest number of incidents
            </p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-4">
            System Performance
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">
                  Alert Acknowledgment Rate
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  98%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: "98%" }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">
                  Sensor Network Uptime
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  99.8%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "99.8%" }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">
                  ML Detection Accuracy
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  95%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
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
