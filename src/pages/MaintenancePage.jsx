import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import {
  Wrench,
  Plus,
  Edit,
  Trash2,
  Camera,
  Radio,
  Circle,
} from "lucide-react";

const MaintenancePage = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .order("name");

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter((device) => {
    if (filterType === "all") return true;
    return device.type === filterType;
  });

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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Maintenance</h1>
          <p className="text-slate-600 mt-1">
            Manage IoT devices and system maintenance
          </p>
        </div>

        {/* Actions Bar */}
        <div className="card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterType("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === "all"
                    ? "bg-primary-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Devices
              </button>
              <button
                onClick={() => setFilterType("camera")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === "camera"
                    ? "bg-primary-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Cameras
              </button>
              <button
                onClick={() => setFilterType("sensor_hub")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === "sensor_hub"
                    ? "bg-primary-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Sensors
              </button>
            </div>

            <button className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </button>
          </div>
        </div>

        {/* Device Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="card text-center">
            <p className="text-sm text-slate-600 mb-1">Total Devices</p>
            <p className="text-3xl font-bold text-slate-900">
              {devices.length}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-slate-600 mb-1">Online</p>
            <p className="text-3xl font-bold text-green-600">
              {devices.filter((d) => d.status === "online").length}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-slate-600 mb-1">Offline</p>
            <p className="text-3xl font-bold text-red-600">
              {devices.filter((d) => d.status === "offline").length}
            </p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-slate-600 mb-1">Maintenance</p>
            <p className="text-3xl font-bold text-yellow-600">
              {devices.filter((d) => d.status === "maintenance").length}
            </p>
          </div>
        </div>

        {/* Devices List */}
        <div className="card">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No devices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Device
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Last Heartbeat
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredDevices.map((device) => (
                    <tr key={device.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${
                              device.type === "camera"
                                ? "bg-blue-100"
                                : "bg-green-100"
                            }`}
                          >
                            {device.type === "camera" ? (
                              <Camera className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Radio className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <span className="font-medium text-slate-900">
                            {device.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 capitalize">
                        {device.type.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {device.location_text}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <Circle
                            className={`w-3 h-3 ${getStatusColor(
                              device.status
                            )} fill-current`}
                          />
                          <span
                            className={`badge ${
                              device.status === "online"
                                ? "badge-success"
                                : device.status === "offline"
                                ? "badge-danger"
                                : "badge-warning"
                            }`}
                          >
                            {device.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {device.last_heartbeat
                          ? new Date(device.last_heartbeat).toLocaleString()
                          : "Never"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-700">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

export default MaintenancePage;
