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
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAnalytics = async () => {
      try {
        setError(null);
        
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
        if (isMounted) {
          setError(error.message || "Failed to load analytics");
        }
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

        {/* Charts Placeholder */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Incidents Over Time
            </h3>
            <div className="aspect-[2/1] bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Chart: Line or bar chart showing incident trends
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Detection Methods
            </h3>
            <div className="aspect-[2/1] bg-slate-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Chart: Pie chart showing YOLOv8 vs Sensor vs Combined
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Most Active Location */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Most Active Location
          </h3>
          <div className="text-center py-8">
            <p className="text-4xl font-bold text-primary-600 dark:text-primary-500">
              {stats.mostActiveLocation}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Location with the highest number of incidents
            </p>
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
