import Layout from "../components/Layout";
import { useAnalytics } from "../hooks/useQueries";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Calendar,
  MapPin,
} from "lucide-react";
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

const AnalyticsPage = () => {
  const { data, isLoading, error, refetch } = useAnalytics();

  // Extract data from query result with defaults
  const stats = data?.stats || {
    totalIncidents: 0,
    last7Days: 0,
    last30Days: 0,
    avgResponseTime: "N/A",
    mostActiveLocation: "N/A",
  };
  const incidentsOverTime = data?.incidentsOverTime || [];
  const detectionMethods = data?.detectionMethods || [];
  const activeLocations = data?.activeLocations || [];

  if (isLoading) {
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
            <p className="text-red-600 dark:text-red-400">
              Error: {error.message || "Failed to load analytics"}
            </p>
            <button onClick={() => refetch()} className="mt-4 btn-primary">
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
              {incidentsOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incidentsOverTime}>
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
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                  No incident data available
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Detection Methods
            </h3>
            <div className="h-64">
              {detectionMethods.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={detectionMethods}
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
                      {detectionMethods.map((entry, index) => (
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
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                  No detection data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Most Active Locations */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Most Active Locations
          </h3>
          {activeLocations.length > 0 ? (
            <div className="space-y-3">
              {activeLocations.map((item, index) => (
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
          ) : (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No location data available
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsPage;
