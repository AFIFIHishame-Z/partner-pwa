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
        // Handle different response formats - prioritize dataUrl over base64
        const imageData =
          response.data.dataUrl || response.data.base64 || response.data.path;

        if (imageData) {
          console.log("Image data received:", {
            hasDataUrl: !!response.data.dataUrl,
            hasBase64: !!response.data.base64,
            hasPath: !!response.data.path,
            imageDataLength: imageData.length,
            imageDataStart: imageData.substring(0, 50),
          });

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
    console.log("Formatting image src:", {
      imageDataLength: imageData.length,
      imageDataStart: imageData.substring(0, 50),
      startsWithData: imageData.startsWith("data:"),
      startsWithSlash: imageData.startsWith("/"),
      startsWithFile: imageData.startsWith("file://"),
    });

    // Handle different image data formats
    if (imageData.startsWith("data:")) {
      console.log("Using data URL directly");
      return imageData; // Already a data URL
    } else if (imageData.startsWith("/") || imageData.startsWith("file://")) {
      console.log("Using file path");
      return imageData; // File path
    } else {
      // Assume base64 data
      console.log("Converting base64 to data URL");
      return `data:image/jpeg;base64,${imageData}`;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "20px",
      }}
    >
      {/* Camera Capture Section */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            color: "#495057",
            fontSize: "1.8rem",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          📸 Camera Capture
        </h2>

        {/* Communication Status */}
        <div
          style={{
            background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "30px",
            border: "1px solid #dee2e6",
          }}
        >
          <h3
            style={{
              margin: "0 0 15px 0",
              color: "#495057",
              fontSize: "1.3rem",
            }}
          >
            🔗 Communication Status
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
            }}
          >
            <div
              style={{
                padding: "12px",
                background: iframeCommunication.isCommunicationReady()
                  ? "rgba(40, 167, 69, 0.1)"
                  : "rgba(220, 53, 69, 0.1)",
                borderRadius: "8px",
                border: `1px solid ${
                  iframeCommunication.isCommunicationReady()
                    ? "rgba(40, 167, 69, 0.3)"
                    : "rgba(220, 53, 69, 0.3)"
                }`,
              }}
            >
              <strong style={{ color: "#495057" }}>Ready:</strong>{" "}
              <span
                style={{
                  color: iframeCommunication.isCommunicationReady()
                    ? "#28a745"
                    : "#dc3545",
                  fontWeight: "600",
                }}
              >
                {iframeCommunication.isCommunicationReady()
                  ? "✅ Yes"
                  : "❌ No"}
              </span>
            </div>
            <div
              style={{
                padding: "12px",
                background:
                  window.parent !== window
                    ? "rgba(40, 167, 69, 0.1)"
                    : "rgba(220, 53, 69, 0.1)",
                borderRadius: "8px",
                border: `1px solid ${
                  window.parent !== window
                    ? "rgba(40, 167, 69, 0.3)"
                    : "rgba(220, 53, 69, 0.3)"
                }`,
              }}
            >
              <strong style={{ color: "#495057" }}>Parent Window:</strong>{" "}
              <span
                style={{
                  color: window.parent !== window ? "#28a745" : "#dc3545",
                  fontWeight: "600",
                }}
              >
                {window.parent !== window ? "✅ Detected" : "❌ Not found"}
              </span>
            </div>
          </div>
        </div>

        {/* Camera Controls */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          {!capturedImage ? (
            <button
              onClick={handleCapturePhoto}
              disabled={isLoading}
              style={{
                background: isLoading
                  ? "linear-gradient(135deg, #ccc 0%, #999 100%)"
                  : "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
                color: "white",
                border: "none",
                padding: "16px 32px",
                borderRadius: "12px",
                fontSize: "18px",
                fontWeight: "600",
                cursor: isLoading ? "not-allowed" : "pointer",
                minWidth: "200px",
                boxShadow: isLoading
                  ? "none"
                  : "0 4px 15px rgba(0, 123, 255, 0.3)",
                transition: "all 0.3s ease",
              }}
            >
              {isLoading ? "⏳ Capturing..." : "📸 Capture Photo"}
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                gap: "15px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleCapturePhoto}
                disabled={isLoading}
                style={{
                  background: isLoading
                    ? "linear-gradient(135deg, #ccc 0%, #999 100%)"
                    : "linear-gradient(135deg, #28a745 0%, #1e7e34 100%)",
                  color: "white",
                  border: "none",
                  padding: "16px 32px",
                  borderRadius: "12px",
                  fontSize: "18px",
                  fontWeight: "600",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  boxShadow: isLoading
                    ? "none"
                    : "0 4px 15px rgba(40, 167, 69, 0.3)",
                  transition: "all 0.3s ease",
                }}
              >
                {isLoading ? "⏳ Capturing..." : "📸 Take Another"}
              </button>
              <button
                onClick={handleRetakePhoto}
                style={{
                  background:
                    "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
                  color: "white",
                  border: "none",
                  padding: "16px 32px",
                  borderRadius: "12px",
                  fontSize: "18px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(220, 53, 69, 0.3)",
                  transition: "all 0.3s ease",
                }}
              >
                🗑️ Clear
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div
            style={{
              background: "linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)",
              color: "#721c24",
              padding: "16px",
              borderRadius: "12px",
              marginBottom: "30px",
              border: "1px solid #f5c6cb",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Captured Image */}
        {capturedImage && (
          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                marginBottom: "20px",
                color: "#495057",
                fontSize: "1.5rem",
                fontWeight: "600",
              }}
            >
              📷 Captured Photo
            </h3>
            <div
              style={{
                border: "3px solid #007bff",
                borderRadius: "16px",
                padding: "20px",
                background: "white",
                display: "inline-block",
                boxShadow: "0 8px 32px rgba(0, 123, 255, 0.2)",
              }}
            >
              <img
                src={formatImageSrc(capturedImage)}
                alt="Captured photo"
                style={{
                  maxWidth: "100%",
                  maxHeight: "500px",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                }}
                onError={(e) => {
                  console.error("Image load error:", e);
                  setError("Failed to display captured image");
                }}
                onLoad={() => {
                  console.log("Image loaded successfully");
                  setError(null);
                }}
              />
            </div>
            {lastCaptureTime && (
              <p
                style={{
                  marginTop: "15px",
                  color: "#6c757d",
                  fontSize: "16px",
                  fontWeight: "500",
                }}
              >
                📅 Captured at: {lastCaptureTime.toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Access Vocal Section */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            color: "#495057",
            fontSize: "1.8rem",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          🎤 Access Vocal
        </h2>
        <p style={{ color: "#6c757d", marginBottom: "20px" }}>
          Voice recognition and speech-to-text functionality
        </p>
        <button
          disabled
          style={{
            background: "linear-gradient(135deg, #ccc 0%, #999 100%)",
            color: "#666",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "not-allowed",
            boxShadow: "none",
            opacity: 0.6,
          }}
        >
          🎤 Start Voice Recording (Disabled)
        </button>
      </div>

      {/* Geolocation Section */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            color: "#495057",
            fontSize: "1.8rem",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          📍 Geolocation
        </h2>
        <p style={{ color: "#6c757d", marginBottom: "20px" }}>
          GPS location services and mapping functionality
        </p>
        <button
          disabled
          style={{
            background: "linear-gradient(135deg, #ccc 0%, #999 100%)",
            color: "#666",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "not-allowed",
            boxShadow: "none",
            opacity: 0.6,
          }}
        >
          📍 Get Current Location (Disabled)
        </button>
      </div>

      {/* Notifications Section */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            color: "#495057",
            fontSize: "1.8rem",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          🔔 Notifications
        </h2>
        <p style={{ color: "#6c757d", marginBottom: "20px" }}>
          Push notifications and alert management
        </p>
        <button
          disabled
          style={{
            background: "linear-gradient(135deg, #ccc 0%, #999 100%)",
            color: "#666",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "not-allowed",
            boxShadow: "none",
            opacity: 0.6,
          }}
        >
          🔔 Request Notification Permission (Disabled)
        </button>
      </div>

      {/* Filesystem Section */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            color: "#495057",
            fontSize: "1.8rem",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          📁 Filesystem
        </h2>
        <p style={{ color: "#6c757d", marginBottom: "20px" }}>
          File system access and document management
        </p>
        <button
          disabled
          style={{
            background: "linear-gradient(135deg, #ccc 0%, #999 100%)",
            color: "#666",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "not-allowed",
            boxShadow: "none",
            opacity: 0.6,
          }}
        >
          📁 Open File Browser (Disabled)
        </button>
      </div>

      {/* Storage Section */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            color: "#495057",
            fontSize: "1.8rem",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          💾 Storage
        </h2>
        <p style={{ color: "#6c757d", marginBottom: "20px" }}>
          Local storage and data persistence
        </p>
        <button
          disabled
          style={{
            background: "linear-gradient(135deg, #ccc 0%, #999 100%)",
            color: "#666",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "not-allowed",
            boxShadow: "none",
            opacity: 0.6,
          }}
        >
          💾 Test Storage (Disabled)
        </button>
      </div>

      {/* Keyboard Section */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            color: "#495057",
            fontSize: "1.8rem",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          ⌨️ Keyboard
        </h2>
        <p style={{ color: "#6c757d", marginBottom: "20px" }}>
          Virtual keyboard and input management
        </p>
        <button
          disabled
          style={{
            background: "linear-gradient(135deg, #ccc 0%, #999 100%)",
            color: "#666",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "not-allowed",
            boxShadow: "none",
            opacity: 0.6,
          }}
        >
          ⌨️ Show Virtual Keyboard (Disabled)
        </button>
      </div>

      {/* Background Tasks Section */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            color: "#495057",
            fontSize: "1.8rem",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          ⚙️ Background Tasks (Limited)
        </h2>
        <p style={{ color: "#6c757d", marginBottom: "20px" }}>
          Background processing and task management
        </p>
        <button
          disabled
          style={{
            background: "linear-gradient(135deg, #ccc 0%, #999 100%)",
            color: "#666",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "not-allowed",
            boxShadow: "none",
            opacity: 0.6,
          }}
        >
          ⚙️ Start Background Task (Disabled)
        </button>
      </div>
    </div>
  );
};

export default CameraCapture;
