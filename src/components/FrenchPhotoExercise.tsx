import { useState } from "react";
import { iframeCommunication } from "../services/IframeCommunication";
import type { CameraResponse } from "../services/IframeCommunication";

const FrenchPhotoExercise = () => {
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
        background: "linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)",
        borderRadius: "16px",
        padding: "30px",
        marginBottom: "20px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(10px)",
        border: "2px solid #28a745",
      }}
    >
      <h2
        style={{
          margin: "0 0 20px 0",
          color: "#155724",
          fontSize: "1.8rem",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        🇫🇷 Exercice Français 1 - Photo Requise
      </h2>

      <div
        style={{
          background: "rgba(255, 255, 255, 0.8)",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          border: "1px solid #28a745",
        }}
      >
        <h3
          style={{
            color: "#155724",
            margin: "0 0 15px 0",
            fontSize: "1.3rem",
          }}
        >
          📝 Instructions
        </h3>
        <p
          style={{
            color: "#155724",
            margin: "0 0 10px 0",
            fontSize: "1.1rem",
          }}
        >
          <strong>Objectif:</strong> Prenez une photo d'un objet de votre
          environnement et décrivez-le en français.
        </p>
        <p
          style={{
            color: "#155724",
            margin: "0 0 15px 0",
            fontSize: "1.1rem",
          }}
        >
          <strong>Exemple:</strong> "Voici une pomme rouge. Elle est ronde et
          sucrée."
        </p>
        <div
          style={{
            background: "rgba(40, 167, 69, 0.1)",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #28a745",
          }}
        >
          <p style={{ color: "#155724", margin: "0", fontWeight: "600" }}>
            📸 <strong>Action requise:</strong> Utilisez la fonctionnalité de
            capture photo ci-dessus
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            background: "linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)",
            color: "#721c24",
            padding: "16px",
            borderRadius: "12px",
            marginBottom: "20px",
            border: "1px solid #f5c6cb",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "20px" }}>⚠️</span>
          <div>
            <strong>Erreur:</strong> {error}
          </div>
        </div>
      )}

      {/* Camera Controls */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        {!capturedImage ? (
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
              minWidth: "200px",
              boxShadow: isLoading
                ? "none"
                : "0 4px 15px rgba(40, 167, 69, 0.3)",
              transition: "all 0.3s ease",
            }}
          >
            {isLoading ? "⏳ Capture en cours..." : "📸 Prendre une Photo"}
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
              {isLoading
                ? "⏳ Capture en cours..."
                : "📸 Prendre une Autre Photo"}
            </button>
            <button
              onClick={handleRetakePhoto}
              style={{
                background: "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
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
              🗑️ Effacer
            </button>
          </div>
        )}
      </div>

      {/* Captured Image */}
      {capturedImage && (
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h3
            style={{
              marginBottom: "20px",
              color: "#155724",
              fontSize: "1.5rem",
              fontWeight: "600",
            }}
          >
            📷 Photo Capturée
          </h3>
          <div
            style={{
              border: "3px solid #28a745",
              borderRadius: "16px",
              padding: "20px",
              background: "white",
              display: "inline-block",
              boxShadow: "0 8px 32px rgba(40, 167, 69, 0.2)",
            }}
          >
            <img
              src={formatImageSrc(capturedImage)}
              alt="Photo capturée"
              style={{
                maxWidth: "100%",
                maxHeight: "500px",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              }}
              onError={(e) => {
                console.error("Image load error:", e);
                setError("Échec de l'affichage de l'image capturée");
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
              📅 Capturée à: {lastCaptureTime.toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "15px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          style={{
            background: "linear-gradient(135deg, #17a2b8 0%, #138496 100%)",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(23, 162, 184, 0.3)",
          }}
        >
          ✅ Marquer comme Terminé
        </button>
      </div>
    </div>
  );
};

export default FrenchPhotoExercise;
