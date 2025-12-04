import { useMemo, useState } from "react";
import Layout from "../components/Layout";
import { useIncidents } from "../hooks/useQueries";
import { format } from "date-fns";
import { FileText, Search, Filter, MapPin, Clock, User } from "lucide-react";

const IncidentsPage = () => {
  const { data: incidents = [], isLoading, error, refetch } = useIncidents();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Memoize filtered incidents for performance
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      // Filter by search term
      const matchesSearch =
        searchTerm === "" ||
        incident.location_text
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        incident.device?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by status
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "acknowledged" &&
          incident.alerts?.[0]?.status === "acknowledged") ||
        (filterStatus === "new" && incident.alerts?.[0]?.status === "new");

      return matchesSearch && matchesStatus;
    });
  }, [incidents, searchTerm, filterStatus]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Loading incidents...
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
              Error: {error.message || "Failed to load incidents"}
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
            Incident History
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Complete log of all fire incidents and responses
          </p>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by location or device..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 input"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="acknowledged">Acknowledged</option>
              </select>
            </div>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="card overflow-hidden">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                No incidents found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                      Incident ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                      Device
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                      Detection Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                      Detected At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                      Acknowledged By
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredIncidents.map((incident) => {
                    const alert = incident.alerts?.[0];
                    return (
                      <tr
                        key={incident.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-400">
                          {String(incident.id).slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <span>{incident.location_text || "Unknown"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {incident.device?.name || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          <span className="badge badge-info">
                            {incident.detection_method}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <div>
                              <p>
                                {format(new Date(incident.detected_at), "PP")}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {format(new Date(incident.detected_at), "p")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {alert?.acknowledged_by_user?.full_name ? (
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                              <span>
                                {alert.acknowledged_by_user.full_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">
                              Not acknowledged
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`badge ${
                              alert?.status === "acknowledged"
                                ? "badge-success"
                                : "badge-danger"
                            }`}
                          >
                            {alert?.status || "new"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Total Incidents
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {incidents.length}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Acknowledged
            </p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-500">
              {
                incidents.filter(
                  (i) => i.alerts?.[0]?.status === "acknowledged"
                ).length
              }
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Pending
            </p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-500">
              {incidents.filter((i) => i.alerts?.[0]?.status === "new").length}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default IncidentsPage;
