import { useEffect, useState, useRef, useCallback } from "react";
import Layout from "../components/Layout";
import { supabaseRest } from "../lib/supabase";
import {
  Camera,
  Circle,
  Play,
  Calendar,
  Video,
  VideoOff,
  AlertTriangle,
  Activity,
  Loader2,
} from "lucide-react";
import testVideo from "../assets/testvideo.mp4";
import { checkMLHealth, createDetectionLoop } from "../services/mlService";
import {
  getOrRegisterDevice,
  createFireAlert,
  setDeviceOffline,
  ALERT_COOLDOWN_MS,
} from "../services/alertService";

const CameraDashboardPage = () => {
  const [cameras, setCameras] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    recordings: 0,
    offline: 0,
  });
  const [archive, setArchive] = useState([]);

  // ML Detection state
  const [useWebcam, setUseWebcam] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [deviceReady, setDeviceReady] = useState(false); // Track device registration
  const [mlStatus, setMlStatus] = useState({
    online: false,
    modelLoaded: false,
  });
  const [lastDetection, setLastDetection] = useState(null);
  const [fireAlert, setFireAlert] = useState(false);

  // Device and cooldown refs
  const deviceRef = useRef(null);
  const lastAlertTimeRef = useRef(null); // null = no previous alert
  const cooldownRemainingRef = useRef(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Sustained detection refs (fire must be detected for 3 seconds)
  const fireDetectionStartRef = useRef(null);
  const isCreatingAlertRef = useRef(false); // Prevent reset during alert creation
  const SUSTAINED_DETECTION_MS = 3000; // 3 seconds

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionLoopRef = useRef(null);

  useEffect(() => {
    console.log("🚀 CameraDashboardPage mounted - initializing...");

    // TEMPORARY: Set test device directly if registration fails
    const testDeviceId = "813ded50-14e5-43f2-b5dd-19dd3e622ae4";
    if (!deviceRef.current) {
      deviceRef.current = { id: testDeviceId, name: "ML-CAM-TEST" };
      setDeviceReady(true);
      console.log("📷 Using fallback test device:", testDeviceId);
    }

    fetchCameras();
    fetchArchive();
    checkMLBackend();
    registerMLDevice();

    // Cooldown timer update
    const cooldownInterval = setInterval(() => {
      if (lastAlertTimeRef.current === null) {
        setCooldownRemaining(0);
        return;
      }
      const remaining = Math.max(
        0,
        ALERT_COOLDOWN_MS - (Date.now() - lastAlertTimeRef.current)
      );
      setCooldownRemaining(remaining);
    }, 1000);

    return () => {
      // Cleanup on unmount
      stopWebcam();
      if (detectionLoopRef.current) {
        detectionLoopRef.current.stop();
      }
      clearInterval(cooldownInterval);
      // Set device offline when leaving
      if (deviceRef.current?.id) {
        setDeviceOffline(deviceRef.current.id);
      }
    };
  }, []);

  // Auto-start detection when webcam is active and ML is ready AND device is registered
  useEffect(() => {
    if (
      useWebcam &&
      mlStatus.online &&
      mlStatus.modelLoaded &&
      deviceReady &&
      !isDetecting
    ) {
      // Small delay to ensure video element is ready
      const timer = setTimeout(() => {
        startDetection();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [useWebcam, mlStatus.online, mlStatus.modelLoaded, deviceReady]);

  const registerMLDevice = async () => {
    console.log("📷 Attempting to register ML device...");
    // Don't set deviceReady to false - keep fallback working
    try {
      const device = await getOrRegisterDevice();
      if (device) {
        deviceRef.current = device;
        setDeviceReady(true);
        console.log("✅ ML Device ready:", device.name, "ID:", device.id);
        // Refresh cameras to include the new device
        fetchCameras();
      } else {
        console.error("❌ Device registration failed - using fallback device");
        // Keep deviceReady true if fallback is set
        if (deviceRef.current?.id) {
          console.log("📷 Fallback device still active:", deviceRef.current.id);
          setDeviceReady(true);
        }
      }
    } catch (err) {
      console.error("❌ Error during device registration:", err);
      // Keep deviceReady true if fallback is set
      if (deviceRef.current?.id) {
        console.log("📷 Fallback device still active:", deviceRef.current.id);
        setDeviceReady(true);
      }
    }
  };

  const checkMLBackend = async () => {
    const status = await checkMLHealth();
    setMlStatus(status);
  };

  const fetchCameras = async () => {
    try {
      console.log("📡 Fetching cameras via REST API...");
      const data = await supabaseRest("devices?type=eq.camera&order=name");

      // Use real data only - no mock fallback
      if (data && data.length > 0) {
        setCameras(data);

        const active = data.filter((c) => c.status === "online").length;
        const offline = data.filter((c) => c.status === "offline").length;
        const maintenance = data.filter(
          (c) => c.status === "maintenance"
        ).length;

        setStats((prev) => ({
          ...prev,
          total: data.length,
          active,
          inactive: maintenance,
          offline,
        }));
        console.log("✅ Cameras fetched:", data.length);
      } else {
        setCameras([]);
        setStats((prev) => ({
          ...prev,
          total: 0,
          active: 0,
          inactive: 0,
          offline: 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching cameras:", error);
      // Set empty state on error - no mock data
      setCameras([]);
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

      // Use real data only - no mock fallback
      if (data && data.length > 0) {
        setArchive(data);
        setStats((prev) => ({ ...prev, recordings: data.length }));
      } else {
        setArchive([]);
        setStats((prev) => ({ ...prev, recordings: 0 }));
      }
    } catch (error) {
      console.error("Error fetching archive:", error);
      // Set empty state on error - no mock data
      setArchive([]);
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

  // Webcam controls
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      setWebcamStream(stream);
      setUseWebcam(true);

      // Wait for state to update, then set video source
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error("Error accessing webcam:", error);
      alert(
        "Could not access webcam. Please ensure camera permissions are granted."
      );
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
    }
    setUseWebcam(false);
    stopDetection();

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleWebcam = () => {
    if (useWebcam) {
      stopWebcam();
    } else {
      startWebcam();
    }
  };

  // Detection controls
  const handleDetectionResult = useCallback(async (result) => {
    setLastDetection(result);
    const now = Date.now();

    if (result.fireDetected) {
      setFireAlert(true);

      // Track sustained detection - fire must be detected for 3 seconds
      if (
        fireDetectionStartRef.current === null &&
        !isCreatingAlertRef.current
      ) {
        fireDetectionStartRef.current = now;
        console.log("🔥 Fire detected, starting 3-second confirmation...");
        return; // Wait for sustained detection
      }

      // Skip if already creating an alert
      if (isCreatingAlertRef.current) {
        console.log("⏳ Alert creation in progress, skipping...");
        return;
      }

      const detectionDuration = now - fireDetectionStartRef.current;

      if (detectionDuration < SUSTAINED_DETECTION_MS) {
        const remainingMs = SUSTAINED_DETECTION_MS - detectionDuration;
        console.log(
          `🔥 Fire detected for ${Math.floor(
            detectionDuration / 1000
          )}s, need ${Math.ceil(remainingMs / 1000)}s more...`
        );
        return; // Keep waiting
      }

      // Fire confirmed for 3+ seconds - now check cooldown
      console.log("🔥 FIRE CONFIRMED for 3+ seconds!", result);

      // Check cooldown before creating alert
      const timeSinceLastAlert =
        lastAlertTimeRef.current === null
          ? Infinity
          : now - lastAlertTimeRef.current;

      // Log device status for debugging
      console.log(
        "📷 Device status:",
        deviceRef.current
          ? `ID: ${deviceRef.current.id}`
          : "NO DEVICE REGISTERED"
      );
      console.log(
        "⏱️ Time since last alert:",
        timeSinceLastAlert === Infinity
          ? "Never"
          : `${Math.floor(timeSinceLastAlert / 1000)}s`
      );

      if (timeSinceLastAlert >= ALERT_COOLDOWN_MS && deviceRef.current?.id) {
        console.log("🚨 Creating alert (cooldown passed)...");

        // Set flag to prevent race conditions
        isCreatingAlertRef.current = true;

        try {
          // Create incident and alert in Supabase
          const alertResult = await createFireAlert(
            deviceRef.current.id,
            result
          );

          if (alertResult) {
            console.log("✅ Alert created successfully:", alertResult);
            lastAlertTimeRef.current = now;
            // Reset sustained detection after successful alert
            fireDetectionStartRef.current = null;
            // Refresh data to show new incident
            fetchCameras();
          } else {
            console.error(
              "❌ Failed to create alert - createFireAlert returned null"
            );
          }
        } catch (err) {
          console.error("❌ Error creating alert:", err);
        } finally {
          isCreatingAlertRef.current = false;
        }
      } else if (!deviceRef.current?.id) {
        console.error("❌ Cannot create alert: No device registered");
      } else if (timeSinceLastAlert < ALERT_COOLDOWN_MS) {
        const remainingSec = Math.ceil(
          (ALERT_COOLDOWN_MS - timeSinceLastAlert) / 1000
        );
        console.log(`⏳ Cooldown active: ${remainingSec}s remaining`);
      }
    } else {
      setFireAlert(false);
      // Reset sustained detection if fire is no longer detected (but not during alert creation)
      if (
        fireDetectionStartRef.current !== null &&
        !isCreatingAlertRef.current
      ) {
        console.log("🔥 Fire no longer detected, resetting confirmation timer");
        fireDetectionStartRef.current = null;
      }
    }
  }, []);

  const startDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;

    detectionLoopRef.current = createDetectionLoop(
      videoRef.current,
      canvasRef.current,
      handleDetectionResult,
      2000 // 2 second interval
    );
    detectionLoopRef.current.start();
    setIsDetecting(true);
  };

  const stopDetection = () => {
    if (detectionLoopRef.current) {
      detectionLoopRef.current.stop();
    }
    setIsDetecting(false);
    setFireAlert(false);
    setLastDetection(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header with Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Camera Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              General Control Center - Live Camera Feeds
            </p>
          </div>

          {/* ML Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* ML Status Indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                mlStatus.online && mlStatus.modelLoaded
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}
            >
              <Circle
                className={`w-2 h-2 fill-current ${
                  mlStatus.online ? "text-green-500" : "text-yellow-500"
                }`}
              />
              <span>
                ML:{" "}
                {mlStatus.online
                  ? mlStatus.modelLoaded
                    ? "Ready"
                    : "No Model"
                  : "Offline"}
              </span>
            </div>

            {/* Webcam Toggle Button */}
            <button
              onClick={toggleWebcam}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                useWebcam
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-primary-600 hover:bg-primary-700 text-white"
              }`}
            >
              {useWebcam ? (
                <VideoOff className="w-5 h-5" />
              ) : (
                <Video className="w-5 h-5" />
              )}
              {useWebcam ? "Stop Webcam" : "Use Webcam"}
            </button>

            {/* Auto-detection indicator */}
            {useWebcam && isDetecting && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <Activity className="w-4 h-4 animate-pulse" />
                <span>Auto-detecting</span>
              </div>
            )}

            {/* Cooldown indicator */}
            {cooldownRemaining > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cooldown: {Math.ceil(cooldownRemaining / 1000)}s</span>
              </div>
            )}
          </div>
        </div>

        {/* Fire Alert Banner */}
        {fireAlert && (
          <div className="bg-red-600 text-white p-4 rounded-lg flex items-center gap-3 animate-pulse">
            <AlertTriangle className="w-8 h-8" />
            <div>
              <p className="font-bold text-lg">🔥 FIRE DETECTED!</p>
              <p className="text-sm opacity-90">
                Confidence:{" "}
                {((lastDetection?.highestConfidence || 0) * 100).toFixed(1)}% -
                Immediate action required!
              </p>
            </div>
          </div>
        )}

        {/* Live Webcam Feed with Detection */}
        {useWebcam && (
          <div className="card">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
              Live Webcam Feed - Fire Detection
            </h2>
            <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden max-w-3xl mx-auto">
              {/* Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />

              {/* Detection Overlay Canvas */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                width={640}
                height={480}
              />

              {/* Status Indicators */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className="flex items-center space-x-2 bg-black/70 px-2 py-1 rounded">
                  <Circle className="w-2 h-2 text-red-500 fill-red-500 animate-pulse" />
                  <span className="text-xs text-white font-medium">
                    WEBCAM LIVE
                  </span>
                </div>
                {isDetecting && (
                  <div className="flex items-center space-x-2 bg-green-600/90 px-2 py-1 rounded">
                    <Activity className="w-3 h-3 text-white" />
                    <span className="text-xs text-white font-medium">
                      DETECTING
                    </span>
                  </div>
                )}
              </div>

              {/* Detection Info */}
              {lastDetection && (
                <div className="absolute bottom-3 left-3 bg-black/70 px-3 py-2 rounded text-white text-sm">
                  <p>
                    Last scan:{" "}
                    {new Date(lastDetection.timestamp).toLocaleTimeString()}
                  </p>
                  <p>Detections: {lastDetection.detections?.length || 0}</p>
                  {lastDetection.highestConfidence > 0 && (
                    <p>
                      Highest confidence:{" "}
                      {(lastDetection.highestConfidence * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

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
