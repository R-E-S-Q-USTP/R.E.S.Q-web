import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import { Map as MapIcon, MapPin, Flame, Camera, Radio } from "lucide-react";

const MapPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      // Fetch recent incidents
      const { data: incidentsData } = await supabase
        .from("incidents")
        .select(
          `
          *,
          device:devices(*)
        `
        )
        .order("detected_at", { ascending: false })
        .limit(20);

      // Fetch all devices
      const { data: devicesData } = await supabase
        .from("devices")
        .select("*")
        .order("name");

      setIncidents(incidentsData || []);
      setDevices(devicesData || []);
    } catch (error) {
      console.error("Error fetching map data:", error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Geographic Map</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Real-time visualization of incidents and device locations
          </p>
        </div>

        {/* Map Container */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 card">
            <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-700/50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
              <div className="text-center">
                <MapIcon className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-300 font-medium">Interactive Map</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
                  Integrate with mapping library (e.g., Leaflet, Mapbox) to
                  display real-time device locations and incident markers
                </p>
              </div>
            </div>

            {/* Map Legend */}
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Active Incident</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Camera</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Sensor</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Incidents */}
            <div className="card">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center space-x-2">
                <Flame className="w-5 h-5 text-red-600 dark:text-red-500" />
                <span>Recent Incidents</span>
              </h3>

              {incidents.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No recent incidents
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {incidents.slice(0, 10).map((incident) => (
                    <button
                      key={incident.id}
                      onClick={() =>
                        setSelectedItem({ type: "incident", data: incident })
                      }
                      className="w-full text-left p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-red-600 dark:text-red-500 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {incident.location_text}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {new Date(incident.detected_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Device List */}
            <div className="card">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Devices</h3>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {devices.map((device) => (
                  <button
                    key={device.id}
                    onClick={() =>
                      setSelectedItem({ type: "device", data: device })
                    }
                    className="w-full text-left p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-start space-x-2">
                      {device.type === "camera" ? (
                        <Camera className="w-4 h-4 text-blue-600 dark:text-blue-500 mt-0.5" />
                      ) : (
                        <Radio className="w-4 h-4 text-green-600 dark:text-green-500 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {device.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {device.location_text}
                        </p>
                        <div className="mt-1">
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
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Item Details */}
        {selectedItem && (
          <div className="card">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Selected Item Details
            </h3>
            <pre className="bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(selectedItem.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MapPage;
