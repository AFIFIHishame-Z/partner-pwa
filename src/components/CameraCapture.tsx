import { useState } from "react";
import { iframeCommunication } from "../services/IframeCommunication";
import type { CameraResponse } from "../services/IframeCommunication";

const CameraCapture = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastCaptureTime, setLastCaptureTime] = useState<Date | null>(null);

  const handleCapturePhoto = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Requesting camera access from parent app...");

      const response: CameraResponse =
        await iframeCommunication.requestCameraCapture({
          quality: 0.8,
          allowEditing: false,
          correctOrientation: true,
        });

      if (response.success && response.data) {
        // Handle different response formats
        const imageData =
          response.data.base64 || response.data.dataUrl || response.data.path;

        if (imageData) {
          setCapturedImage(imageData);
          setLastCaptureTime(new Date());
          console.log("Photo captured successfully:", response);
        } else {
          throw new Error("No image data received");
        }
      } else {
        throw new Error(response.error || "Camera capture failed");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Camera capture error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setError(null);
    setLastCaptureTime(null);
  };

  const formatImageSrc = (imageData: string) => {
    // Handle different image data formats
    if (imageData.startsWith("data:")) {
      return imageData; // Already a data URL
    } else if (imageData.startsWith("/") || imageData.startsWith("file://")) {
      return imageData; // File path
    } else {
      // Assume base64 data
      return `data:image/jpeg;base64,${imageData}`;
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        📸 Camera Test - Iframe Communication
      </h2>

      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h3>Communication Status</h3>
        <p>
          <strong>Ready:</strong>{" "}
          {iframeCommunication.isCommunicationReady() ? "✅ Yes" : "❌ No"}
        </p>
        <p>
          <strong>Parent Window:</strong>{" "}
          {window.parent !== window ? "✅ Detected" : "❌ Not found"}
        </p>
      </div>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        {!capturedImage ? (
          <button
            onClick={handleCapturePhoto}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "6px",
              fontSize: "16px",
              cursor: isLoading ? "not-allowed" : "pointer",
              minWidth: "150px",
            }}
          >
            {isLoading ? "⏳ Capturing..." : "📸 Capture Photo"}
          </button>
        ) : (
          <div>
            <button
              onClick={handleCapturePhoto}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "6px",
                fontSize: "16px",
                cursor: isLoading ? "not-allowed" : "pointer",
                marginRight: "10px",
              }}
            >
              {isLoading ? "⏳ Capturing..." : "📸 Take Another"}
            </button>
            <button
              onClick={handleRetakePhoto}
              style={{
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "6px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              🗑️ Clear
            </button>
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "20px",
            border: "1px solid #f5c6cb",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {capturedImage && (
        <div style={{ textAlign: "center" }}>
          <h3>Captured Photo</h3>
          <div
            style={{
              border: "2px solid #007bff",
              borderRadius: "8px",
              padding: "10px",
              backgroundColor: "white",
              display: "inline-block",
            }}
          >
            <img
              src={formatImageSrc(capturedImage)}
              alt="Captured photo"
              style={{
                maxWidth: "100%",
                maxHeight: "400px",
                borderRadius: "4px",
              }}
              onError={(e) => {
                console.error("Image load error:", e);
                setError("Failed to display captured image");
              }}
            />
          </div>
          {lastCaptureTime && (
            <p
              style={{
                marginTop: "10px",
                color: "#666",
                fontSize: "14px",
              }}
            >
              Captured at: {lastCaptureTime.toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: "30px",
          padding: "15px",
          backgroundColor: "#e9ecef",
          borderRadius: "6px",
          fontSize: "14px",
        }}
      >
        <h4>Testing Instructions:</h4>
        <ol>
          <li>
            This app should be embedded in an iframe within a Capacitor-based
            PWA
          </li>
          <li>
            The parent app should handle the camera request and return the image
            data
          </li>
          <li>Check the browser console for communication logs</li>
          <li>
            Verify that the parent app receives the camera request message
          </li>
        </ol>
      </div>
    </div>
  );
};

export default CameraCapture;
