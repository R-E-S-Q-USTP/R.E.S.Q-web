import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import { Map as MapIcon, MapPin, Flame, Camera, Radio } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons
const createIcon = (color) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const incidentIcon = createIcon("#dc2626");
const cameraIcon = createIcon("#2563eb");
const sensorIcon = createIcon("#16a34a");

// Mock map data with coordinates (centered around a sample location)
const mockIncidents = [
  {
    id: 1,
    location_text: "Building A - Floor 2",
    lat: 14.5995,
    lng: 120.9842,
    detected_at: "2024-01-15T10:30:00Z",
    status: "active",
  },
  {
    id: 2,
    location_text: "Warehouse Section C",
    lat: 14.598,
    lng: 120.9855,
    detected_at: "2024-01-15T09:15:00Z",
    status: "resolved",
  },
  {
    id: 3,
    location_text: "Parking Garage B",
    lat: 14.601,
    lng: 120.983,
    detected_at: "2024-01-14T16:45:00Z",
    status: "active",
  },
];

const mockDevices = [
  {
    id: 1,
    name: "Camera 01 - Main Entrance",
    type: "camera",
    lat: 14.5992,
    lng: 120.9845,
    status: "online",
    location_text: "Main Entrance",
  },
  {
    id: 2,
    name: "Camera 02 - Warehouse",
    type: "camera",
    lat: 14.5978,
    lng: 120.986,
    status: "online",
    location_text: "Warehouse Area",
  },
  {
    id: 3,
    name: "Camera 03 - Parking",
    type: "camera",
    lat: 14.6015,
    lng: 120.9825,
    status: "offline",
    location_text: "Parking Lot B",
  },
  {
    id: 4,
    name: "Sensor Hub A1",
    type: "sensor",
    lat: 14.5998,
    lng: 120.9838,
    status: "online",
    location_text: "Building A - Floor 1",
  },
  {
    id: 5,
    name: "Sensor Hub B2",
    type: "sensor",
    lat: 14.6005,
    lng: 120.985,
    status: "online",
    location_text: "Building B - Floor 2",
  },
  {
    id: 6,
    name: "Sensor Hub C1",
    type: "sensor",
    lat: 14.5985,
    lng: 120.987,
    status: "maintenance",
    location_text: "Building C - Floor 1",
  },
];

const MapPage = () => {
  const [incidents, setIncidents] = useState(mockIncidents);
  const [devices, setDevices] = useState(mockDevices);
  const [selectedItem, setSelectedItem] = useState(null);

  // Map center (Manila, Philippines as example)
  const mapCenter = [14.5995, 120.9842];

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      // Try to fetch real data, fallback to mock data
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

      const { data: devicesData } = await supabase
        .from("devices")
        .select("*")
        .order("name");

      // Use real data if available, otherwise keep mock data
      if (incidentsData && incidentsData.length > 0) {
        setIncidents(incidentsData);
      }
      if (devicesData && devicesData.length > 0) {
        setDevices(devicesData);
      }
    } catch (error) {
      console.error("Error fetching map data:", error);
      // Keep mock data on error
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Geographic Map
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Real-time visualization of incidents and device locations
          </p>
        </div>

        {/* Map Container */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2 card">
            <div className="h-[500px] rounded-lg overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={16}
                style={{ height: "100%", width: "100%" }}
                className="rounded-lg"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Incident Markers */}
                {incidents.map(
                  (incident) =>
                    incident.lat &&
                    incident.lng && (
                      <Marker
                        key={`incident-${incident.id}`}
                        position={[incident.lat, incident.lng]}
                        icon={incidentIcon}
                        eventHandlers={{
                          click: () =>
                            setSelectedItem({
                              type: "incident",
                              data: incident,
                            }),
                        }}
                      >
                        <Popup>
                          <div className="p-1">
                            <p className="font-semibold text-red-600">
                              🔥 Fire Incident
                            </p>
                            <p className="text-sm">{incident.location_text}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(incident.detected_at).toLocaleString()}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    )
                )}

                {/* Device Markers */}
                {devices.map(
                  (device) =>
                    device.lat &&
                    device.lng && (
                      <Marker
                        key={`device-${device.id}`}
                        position={[device.lat, device.lng]}
                        icon={
                          device.type === "camera" ? cameraIcon : sensorIcon
                        }
                        eventHandlers={{
                          click: () =>
                            setSelectedItem({ type: "device", data: device }),
                        }}
                      >
                        <Popup>
                          <div className="p-1">
                            <p className="font-semibold">
                              {device.type === "camera" ? "📷" : "📡"}{" "}
                              {device.name}
                            </p>
                            <p className="text-sm">{device.location_text}</p>
                            <p
                              className={`text-xs mt-1 ${
                                device.status === "online"
                                  ? "text-green-600"
                                  : device.status === "offline"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              Status: {device.status}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    )
                )}
              </MapContainer>
            </div>

            {/* Map Legend */}
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Active Incident
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Camera
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Sensor
                </span>
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
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Devices
              </h3>

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
