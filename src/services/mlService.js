/**
 * ML Service for Fire Detection
 * Handles communication with the Python FastAPI backend
 */

const ML_BACKEND_URL =
  import.meta.env.VITE_ML_BACKEND_URL || "http://localhost:8000";
const CONFIDENCE_THRESHOLD = 0.9; // 90% confidence required
const DETECTION_INTERVAL = 2000; // 2 seconds between detections

/**
 * Check if the ML backend is online
 */
export const checkMLHealth = async () => {
  try {
    const response = await fetch(`${ML_BACKEND_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    return {
      online: true,
      modelLoaded: data.model_loaded,
      ...data,
    };
  } catch (error) {
    console.error("ML Backend health check failed:", error);
    return { online: false, modelLoaded: false, error: error.message };
  }
};

/**
 * Capture a frame from a video element and convert to base64
 */
export const captureFrame = (videoElement) => {
  if (!videoElement || videoElement.readyState < 2) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoElement, 0, 0);

  // Return base64 encoded JPEG
  return canvas.toDataURL("image/jpeg", 0.8);
};

/**
 * Send a frame to the ML backend for fire detection
 */
export const detectFire = async (base64Image) => {
  try {
    const response = await fetch(`${ML_BACKEND_URL}/detect/base64`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      throw new Error(`Detection failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      fireDetected: result.fire_detected,
      highestConfidence: result.highest_confidence,
      detections: result.detections || [],
      threshold: CONFIDENCE_THRESHOLD,
      timestamp: result.timestamp,
    };
  } catch (error) {
    console.error("Fire detection error:", error);
    return {
      success: false,
      fireDetected: false,
      error: error.message,
    };
  }
};

/**
 * Draw detection bounding boxes on a canvas overlay
 */
export const drawDetections = (canvas, detections, videoWidth, videoHeight) => {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Scale factors if canvas size differs from video size
  const scaleX = canvas.width / videoWidth;
  const scaleY = canvas.height / videoHeight;

  detections.forEach((detection) => {
    const { bbox, confidence, class: className } = detection;

    // Draw all detections, highlight fire-related ones
    const isFireRelated = ["fire", "flame", "smoke", "0"].includes(
      className.toLowerCase()
    );

    const x = bbox.x1 * scaleX;
    const y = bbox.y1 * scaleY;
    const width = bbox.width * scaleX;
    const height = bbox.height * scaleY;

    // Draw bounding box
    if (isFireRelated) {
      ctx.strokeStyle = confidence >= 0.9 ? "#ef4444" : "#f59e0b"; // Red for high, orange for medium
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = "#3b82f6"; // Blue for other classes
      ctx.lineWidth = 2;
    }
    ctx.strokeRect(x, y, width, height);

    // Draw label background
    const label = `${className} ${(confidence * 100).toFixed(1)}%`;
    ctx.font = "bold 14px sans-serif";
    const textWidth = ctx.measureText(label).width;

    ctx.fillStyle = isFireRelated
      ? confidence >= 0.9
        ? "#ef4444"
        : "#f59e0b"
      : "#3b82f6";
    ctx.fillRect(x, y - 24, textWidth + 10, 24);

    // Draw label text
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x + 5, y - 7);
  });
};

/**
 * Create a detection loop that runs at specified intervals
 */
export const createDetectionLoop = (
  videoElement,
  canvasElement,
  onDetection,
  intervalMs = DETECTION_INTERVAL
) => {
  let isRunning = false;
  let intervalId = null;

  const runDetection = async () => {
    if (!isRunning) return;

    const frame = captureFrame(videoElement);
    if (frame) {
      const result = await detectFire(frame);

      if (result.success && canvasElement) {
        drawDetections(
          canvasElement,
          result.detections,
          videoElement.videoWidth,
          videoElement.videoHeight
        );
      }

      if (onDetection) {
        onDetection(result);
      }
    }
  };

  return {
    start: () => {
      if (isRunning) return;
      isRunning = true;
      runDetection(); // Run immediately
      intervalId = setInterval(runDetection, intervalMs);
      console.log("Detection loop started");
    },
    stop: () => {
      isRunning = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      // Clear canvas
      if (canvasElement) {
        const ctx = canvasElement.getContext("2d");
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      }
      console.log("Detection loop stopped");
    },
    isRunning: () => isRunning,
  };
};

export default {
  checkMLHealth,
  captureFrame,
  detectFire,
  drawDetections,
  createDetectionLoop,
  CONFIDENCE_THRESHOLD,
  DETECTION_INTERVAL,
};
