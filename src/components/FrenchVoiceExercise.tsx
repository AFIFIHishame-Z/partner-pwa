import { useState } from "react";
import { iframeCommunication } from "../services/IframeCommunication";
import type { VoiceResponse } from "../services/IframeCommunication";

const FrenchVoiceExercise = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number | null>(
    null
  );

  const handleStartRecording = async () => {
    setIsRecording(true);
    setError(null);

    try {
      console.log("Requesting voice recording from parent app...");

      const response: VoiceResponse =
        await iframeCommunication.requestVoiceRecord({
          maxDuration: 60,
          audioFormat: "webm",
          quality: "medium",
        });

      if (response.success && response.data) {
        console.log("Voice recording received:", response);

        if (response.data.audioUrl) {
          setRecordedAudio(response.data.audioUrl);
          setRecordingDuration(response.data.duration || null);
          console.log("Voice recording completed successfully");
        } else {
          throw new Error("No audio data received");
        }
      } else {
        throw new Error(response.error || "Voice recording failed");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Voice recording error:", err);
    } finally {
      setIsRecording(false);
    }
  };

  const handleRetakeRecording = () => {
    setRecordedAudio(null);
    setError(null);
    setRecordingDuration(null);
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)",
        borderRadius: "16px",
        padding: "30px",
        marginBottom: "20px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(10px)",
        border: "2px solid #ffc107",
      }}
    >
      <h2
        style={{
          margin: "0 0 20px 0",
          color: "#856404",
          fontSize: "1.8rem",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        🇫🇷 Exercice Français 2 - Enregistrement Vocal Requis
      </h2>

      <div
        style={{
          background: "rgba(255, 255, 255, 0.8)",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          border: "1px solid #ffc107",
        }}
      >
        <h3
          style={{
            color: "#856404",
            margin: "0 0 15px 0",
            fontSize: "1.3rem",
          }}
        >
          📝 Instructions
        </h3>
        <p
          style={{
            color: "#856404",
            margin: "0 0 10px 0",
            fontSize: "1.1rem",
          }}
        >
          <strong>Objectif:</strong> Enregistrez-vous en train de lire à voix
          haute le texte suivant en français.
        </p>
        <div
          style={{
            background: "rgba(255, 193, 7, 0.1)",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #ffc107",
            marginBottom: "15px",
          }}
        >
          <p
            style={{
              color: "#856404",
              margin: "0 0 10px 0",
              fontWeight: "600",
            }}
          >
            📖 <strong>Texte à lire:</strong>
          </p>
          <p
            style={{
              color: "#856404",
              margin: "0",
              fontStyle: "italic",
              fontSize: "1.1rem",
            }}
          >
            "Bonjour, je m'appelle [votre nom]. J'apprends le français et j'aime
            cette langue. Aujourd'hui, je pratique ma prononciation en lisant ce
            texte. Merci de m'écouter."
          </p>
        </div>
        <div
          style={{
            background: "rgba(255, 193, 7, 0.1)",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #ffc107",
          }}
        >
          <p style={{ color: "#856404", margin: "0", fontWeight: "600" }}>
            🎤 <strong>Action requise:</strong> Utilisez la fonctionnalité
            d'enregistrement vocal
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

      {/* Voice Recording Controls */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        {!recordedAudio ? (
          <button
            onClick={handleStartRecording}
            disabled={isRecording}
            style={{
              background: isRecording
                ? "linear-gradient(135deg, #ccc 0%, #999 100%)"
                : "linear-gradient(135deg, #ffc107 0%, #e0a800 100%)",
              color: isRecording ? "#666" : "#212529",
              border: "none",
              padding: "16px 32px",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: "600",
              cursor: isRecording ? "not-allowed" : "pointer",
              minWidth: "200px",
              boxShadow: isRecording
                ? "none"
                : "0 4px 15px rgba(255, 193, 7, 0.3)",
              transition: "all 0.3s ease",
            }}
          >
            {isRecording
              ? "⏳ Enregistrement en cours..."
              : "🎤 Commencer l'Enregistrement"}
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
              onClick={handleStartRecording}
              disabled={isRecording}
              style={{
                background: isRecording
                  ? "linear-gradient(135deg, #ccc 0%, #999 100%)"
                  : "linear-gradient(135deg, #ffc107 0%, #e0a800 100%)",
                color: isRecording ? "#666" : "#212529",
                border: "none",
                padding: "16px 32px",
                borderRadius: "12px",
                fontSize: "18px",
                fontWeight: "600",
                cursor: isRecording ? "not-allowed" : "pointer",
                boxShadow: isRecording
                  ? "none"
                  : "0 4px 15px rgba(255, 193, 7, 0.3)",
                transition: "all 0.3s ease",
              }}
            >
              {isRecording
                ? "⏳ Enregistrement en cours..."
                : "🎤 Nouvel Enregistrement"}
            </button>
            <button
              onClick={handleRetakeRecording}
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

      {/* Recorded Audio */}
      {recordedAudio && (
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <h3
            style={{
              marginBottom: "20px",
              color: "#856404",
              fontSize: "1.5rem",
              fontWeight: "600",
            }}
          >
            🎵 Enregistrement Vocal
          </h3>
          <div
            style={{
              border: "3px solid #ffc107",
              borderRadius: "16px",
              padding: "20px",
              background: "white",
              display: "inline-block",
              boxShadow: "0 8px 32px rgba(255, 193, 7, 0.2)",
            }}
          >
            <audio
              controls
              style={{
                width: "100%",
                maxWidth: "400px",
              }}
            >
              <source src={recordedAudio} type="audio/webm" />
              Votre navigateur ne supporte pas l'élément audio.
            </audio>
          </div>
          {recordingDuration && (
            <p
              style={{
                marginTop: "15px",
                color: "#6c757d",
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              ⏱️ Durée: {recordingDuration.toFixed(1)} secondes
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
            background: "linear-gradient(135deg, #ffc107 0%, #e0a800 100%)",
            color: "#212529",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(255, 193, 7, 0.3)",
          }}
        >
          ✅ Marquer comme Terminé
        </button>
      </div>
    </div>
  );
};

export default FrenchVoiceExercise;
