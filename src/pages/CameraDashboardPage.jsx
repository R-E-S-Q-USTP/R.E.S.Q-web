import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import { Camera, Circle, Play, Calendar } from "lucide-react";
import testVideo from "../assets/testvideo.mp4";

// Mock camera data
const mockCameras = [
  {
    id: 1,
    name: "Camera 01",
    location_text: "Main Entrance",
    status: "online",
    type: "camera",
  },
  {
    id: 2,
    name: "Camera 02",
    location_text: "Warehouse Area",
    status: "online",
    type: "camera",
  },
  {
    id: 3,
    name: "Camera 03",
    location_text: "Parking Lot B",
    status: "offline",
    type: "camera",
  },
  {
    id: 4,
    name: "Camera 04",
    location_text: "Server Room",
    status: "online",
    type: "camera",
  },
  {
    id: 5,
    name: "Camera 05",
    location_text: "Kitchen Area",
    status: "maintenance",
    type: "camera",
  },
  {
    id: 6,
    name: "Camera 06",
    location_text: "Storage Room",
    status: "online",
    type: "camera",
  },
];

// Mock archive data
const mockArchive = [
  {
    id: 1,
    incident: { location_text: "Building A - Floor 2" },
    created_at: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    incident: { location_text: "Warehouse Section C" },
    created_at: "2024-01-15T09:15:00Z",
  },
  {
    id: 3,
    incident: { location_text: "Server Room" },
    created_at: "2024-01-14T16:45:00Z",
  },
  {
    id: 4,
    incident: { location_text: "Kitchen Area" },
    created_at: "2024-01-14T12:20:00Z",
  },
  {
    id: 5,
    incident: { location_text: "Parking Garage B" },
    created_at: "2024-01-13T22:10:00Z",
  },
  {
    id: 6,
    incident: { location_text: "Storage Room 3" },
    created_at: "2024-01-13T08:30:00Z",
  },
];

const CameraDashboardPage = () => {
  const [cameras, setCameras] = useState(mockCameras);
  const [stats, setStats] = useState({
    total: mockCameras.length,
    active: mockCameras.filter((c) => c.status === "online").length,
    inactive: mockCameras.filter((c) => c.status === "maintenance").length,
    recordings: mockArchive.length,
    offline: mockCameras.filter((c) => c.status === "offline").length,
  });
  const [archive, setArchive] = useState(mockArchive);

  useEffect(() => {
    fetchCameras();
    fetchArchive();
  }, []);

  const fetchCameras = async () => {
    try {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("type", "camera")
        .order("name");

      if (error) throw error;

      // Use real data if available
      if (data && data.length > 0) {
        setCameras(data);

        const active = data.filter((c) => c.status === "online").length;
        const offline = data.filter((c) => c.status === "offline").length;
        const maintenance = data.filter(
          (c) => c.status === "maintenance"
        ).length;

        setStats({
          total: data.length,
          active,
          inactive: maintenance,
          recordings: archive.length,
          offline,
        });
      }
    } catch (error) {
      console.error("Error fetching cameras:", error);
      // Keep mock data on error
    }
  };

  const fetchArchive = async () => {
    try {
      const { data, error } = await supabase
        .from("event_recordings")
        .select(
          `
          *,
          incident:incidents(*)
        `
        )
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;

      // Use real data if available
      if (data && data.length > 0) {
        setArchive(data);
      }
    } catch (error) {
      console.error("Error fetching archive:", error);
      // Keep mock data on error
    }
  };

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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Camera Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            General Control Center - Live Camera Feeds
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Total Cameras
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {stats.total}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Active
            </p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.active}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Inactive
            </p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.inactive}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Recordings
            </p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.recordings}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
              Offline
            </p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {stats.offline}
            </p>
          </div>
        </div>

        {/* Live Camera Feeds Grid */}
        <div className="card">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
            Live Camera Feeds
          </h2>

          {cameras.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                No cameras registered
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cameras.map((camera) => (
                <div
                  key={camera.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                >
                  {/* Camera Feed */}
                  <div className="aspect-video bg-slate-900 relative">
                    {/* Always show test video for demo purposes */}
                    <video
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    >
                      <source src={testVideo} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>

                    {/* Live Indicator - always show since all cameras are active */}
                    <div className="absolute top-3 left-3 flex items-center space-x-2 bg-black/70 px-2 py-1 rounded">
                      <Circle className="w-2 h-2 text-red-500 fill-red-500 animate-pulse" />
                      <span className="text-xs text-white font-medium">
                        LIVE
                      </span>
                    </div>
                  </div>

                  {/* Camera Info */}
                  <div className="p-3 bg-white dark:bg-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {camera.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {camera.location_text}
                        </p>
                      </div>
                      <Circle className="w-3 h-3 text-green-500 fill-current" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Archive Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Event Archive
            </h2>
            <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>

          {archive.length === 0 ? (
            <div className="text-center py-12">
              <Play className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                No recorded events
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {archive.map((recording) => (
                <button
                  key={recording.id}
                  className="group relative aspect-video bg-slate-900 rounded-lg overflow-hidden hover:ring-2 ring-primary-500 transition-all"
                >
                  <video
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  >
                    <source src={testVideo} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-xs text-white truncate">
                      {recording.incident?.location_text}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CameraDashboardPage;
