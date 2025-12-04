"""
R.E.S.Q. Fire Detection API
FastAPI backend for YOLOv8 fire detection inference
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import base64
import torch
from ultralytics import YOLO
import os
from datetime import datetime

# Load YOLOv8 model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "best.pt")
model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load the model
    global model
    try:
        if os.path.exists(MODEL_PATH):
            # Fix for PyTorch 2.6+ security change
            # Add safe globals for ultralytics model loading
            try:
                from ultralytics.nn.tasks import DetectionModel
                torch.serialization.add_safe_globals([DetectionModel])
            except:
                pass
            
            model = YOLO(MODEL_PATH)
            print(f"✅ Model loaded successfully from {MODEL_PATH}")
            print(f"📋 Model classes: {model.names}")
        else:
            print(f"⚠️ Model file not found at {MODEL_PATH}")
            print("Please copy best.pt to the ml_backend folder")
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        # Try alternative loading method
        try:
            print("🔄 Trying alternative loading method...")
            # Force weights_only=False for older model files
            original_load = torch.load
            torch.load = lambda *args, **kwargs: original_load(*args, **{**kwargs, 'weights_only': False})
            model = YOLO(MODEL_PATH)
            torch.load = original_load
            print(f"✅ Model loaded successfully with alternative method")
            print(f"📋 Model classes: {model.names}")
        except Exception as e2:
            print(f"❌ Alternative loading also failed: {e2}")
    
    yield  # Server is running
    
    # Shutdown: Cleanup if needed
    print("Shutting down...")

app = FastAPI(
    title="R.E.S.Q. Fire Detection API",
    description="YOLOv8-based fire detection for the R.E.S.Q. monitoring system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "R.E.S.Q. Fire Detection API",
        "model_loaded": model is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy" if model else "degraded",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH,
        "model_exists": os.path.exists(MODEL_PATH)
    }

@app.post("/detect/base64")
async def detect_fire_base64(data: dict):
    """
    Detect fire from a base64-encoded image
    
    Expected payload:
    {
        "image": "base64_encoded_image_string"
    }
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Please check server logs.")
    
    try:
        # Decode base64 image
        image_data = data.get("image", "")
        
        # Remove data URL prefix if present
        if "," in image_data:
            image_data = image_data.split(",")[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image format")
        
        # Run inference
        results = model(image, verbose=False)
        
        detections = []
        highest_confidence = 0.0
        fire_detected = False
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    confidence = float(box.conf[0])
                    class_id = int(box.cls[0])
                    class_name = model.names[class_id] if hasattr(model, 'names') else f"class_{class_id}"
                    
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    
                    detection = {
                        "class": class_name,
                        "confidence": confidence,
                        "bbox": {
                            "x1": int(x1),
                            "y1": int(y1),
                            "x2": int(x2),
                            "y2": int(y2),
                            "width": int(x2 - x1),
                            "height": int(y2 - y1)
                        }
                    }
                    detections.append(detection)
                    
                    # Check for fire detection (90% threshold)
                    if class_name.lower() in ["fire", "flame", "smoke", "0"]:
                        if confidence > highest_confidence:
                            highest_confidence = confidence
                        if confidence >= 0.90:
                            fire_detected = True
        
        return {
            "success": True,
            "fire_detected": fire_detected,
            "highest_confidence": highest_confidence,
            "detection_count": len(detections),
            "detections": detections,
            "threshold": 0.90,
            "image_size": {
                "width": image.shape[1],
                "height": image.shape[0]
            },
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
