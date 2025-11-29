import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import { format } from "date-fns";
import { FileText, Search, Filter, MapPin, Clock, User } from "lucide-react";

// Mock incident data
const mockIncidents = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    location_text: "Building A - Floor 2",
    detected_at: "2024-01-15T10:30:00Z",
    detection_method: "YOLOv8 Camera",
    confidence_score: 0.95,
    status: "resolved",
    device: { id: 1, name: "Camera 01 - Main Entrance", type: "camera" },
    alerts: [
      {
        status: "acknowledged",
        acknowledged_by_user: { full_name: "John Smith" },
      },
    ],
    sensor_snapshot: {
      temperature: "85°C",
      smoke_level: "High",
      humidity: "45%",
    },
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
    location_text: "Warehouse Section C",
    detected_at: "2024-01-15T09:15:00Z",
    detection_method: "Temperature Sensor",
    confidence_score: 0.88,
    status: "active",
    device: { id: 4, name: "Sensor Hub A1", type: "sensor" },
    alerts: [{ status: "new" }],
    sensor_snapshot: {
      temperature: "72°C",
      smoke_level: "Medium",
      humidity: "38%",
    },
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-345678901234",
    location_text: "Server Room",
    detected_at: "2024-01-14T16:45:00Z",
    detection_method: "Smoke Sensor",
    confidence_score: 0.92,
    status: "resolved",
    device: { id: 5, name: "Sensor Hub B2", type: "sensor" },
    alerts: [
      {
        status: "acknowledged",
        acknowledged_by_user: { full_name: "Maria Garcia" },
      },
    ],
    sensor_snapshot: {
      temperature: "55°C",
      smoke_level: "Low",
      humidity: "52%",
    },
  },
  {
    id: "d4e5f6a7-b8c9-0123-defa-456789012345",
    location_text: "Kitchen Area - Cafeteria",
    detected_at: "2024-01-14T12:20:00Z",
    detection_method: "Combined Detection",
    confidence_score: 0.98,
    status: "resolved",
    device: { id: 2, name: "Camera 02 - Warehouse", type: "camera" },
    alerts: [
      {
        status: "acknowledged",
        acknowledged_by_user: { full_name: "John Smith" },
      },
    ],
    sensor_snapshot: {
      temperature: "68°C",
      smoke_level: "High",
      humidity: "35%",
    },
  },
  {
    id: "e5f6a7b8-c9d0-1234-efab-567890123456",
    location_text: "Parking Garage B",
    detected_at: "2024-01-13T22:10:00Z",
    detection_method: "YOLOv8 Camera",
    confidence_score: 0.85,
    status: "active",
    device: { id: 3, name: "Camera 03 - Parking", type: "camera" },
    alerts: [{ status: "new" }],
    sensor_snapshot: {
      temperature: "45°C",
      smoke_level: "Low",
      humidity: "60%",
    },
  },
  {
    id: "f6a7b8c9-d0e1-2345-fabc-678901234567",
    location_text: "Storage Room 3",
    detected_at: "2024-01-13T08:30:00Z",
    detection_method: "Temperature Sensor",
    confidence_score: 0.91,
    status: "resolved",
    device: { id: 6, name: "Sensor Hub C1", type: "sensor" },
    alerts: [
      {
        status: "acknowledged",
        acknowledged_by_user: { full_name: "Alex Johnson" },
      },
    ],
    sensor_snapshot: {
      temperature: "78°C",
      smoke_level: "Medium",
      humidity: "42%",
    },
  },
];

const IncidentsPage = () => {
  const [incidents, setIncidents] = useState(mockIncidents);
  const [loading, setLoading] = useState(false); // Start with false - show mock data immediately
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    let isMounted = true;

    const fetchIncidents = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("incidents")
          .select(
            `
            *,
            device:devices(*),
            alerts(
              *,
              acknowledged_by_user:users!acknowledged_by(full_name)
            )
          `
          )
          .order("detected_at", { ascending: false });

        if (fetchError) throw fetchError;

        if (isMounted) {
          // Use fetched data if available, otherwise keep mock data
          if (data && data.length > 0) {
            setIncidents(data);
          }
        }
      } catch (error) {
        console.error("Error fetching incidents:", error);
        // Keep mock data on error
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchIncidents();

    return () => {
      isMounted = false;
    };
  }, []); // Filtering is done client-side

  const filteredIncidents = incidents.filter((incident) => {
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

  if (loading) {
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
