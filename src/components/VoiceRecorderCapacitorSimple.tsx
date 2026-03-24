import { useEffect, useState } from "react";
import {
  VoiceRecorder,
  RecorderState,
  type PermissionStatus,
  formatDuration,
  AudioFormat,
  SampleRate,
  type RecordingResult,
} from "@superapp_men/voice-recorder-capacitor";

function decodeBase64ToBlob(base64: string, mimeType = "audio/wav"): Blob {
  const byteString = atob(base64);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([byteArray], { type: mimeType });
}

export function VoiceRecorderCapacitorSimple() {
  const [recorder] = useState(
    () =>
      new VoiceRecorder({
        timeout: 10000,
        debug: true,
      })
  );

  const [state, setState] = useState<RecorderState>(RecorderState.IDLE);
  const [permission, setPermission] = useState<PermissionStatus>("unknown");
  const [duration, setDuration] = useState(0);
  const [recording, setRecording] = useState<RecordingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [showFullResponse, setShowFullResponse] = useState(false);
  const [decodedBlobUrl, setDecodedBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check availability on mount
    recorder.isAvailable().then(setAvailable);
console.log("test stateChange");

    // State changes
    const unsubState = recorder.on("stateChange", ({ state }: any) => {
      setState(state);
      console.log("test stateChange 2");

      console.log("stateChange : " + JSON.stringify(state));
    });

    // Progress updates
    const unsubProgress = recorder.on("progress", ({ duration }: any) => {
      setDuration(duration);
      console.log("progress : " + JSON.stringify(duration));
    });

    // Error handling
    const unsubError = recorder.on("error", ({ message }: any) => {
      setError(message);
    });

    return () => {
      unsubState();
      unsubProgress();
      unsubError();
      recorder.destroy();
    };
  }, [recorder]);

  const isRecording = state === RecorderState.RECORDING;

  const handleCheckPermission = async () => {
    try {
      const status = await recorder.checkPermission();
      setPermission(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de la vérification de l'autorisation");
    }
  };

  const handleRequestPermission = async () => {
    try {
      const status = await recorder.requestPermission();
      setPermission(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de la demande d'autorisation");
    }
  };

  const handleStart = async () => {
    try {
      setError(null);
      setRecording(null);

      if (permission !== "granted") {
        const p = await recorder.requestPermission();
        setPermission(p);
        if (p !== "granted") {
          setError("L'autorisation du microphone est requise");
          return;
        }
      }

      await recorder.startRecording({
        isCheckpoints: false, // Disable checkpoint mode - simple recording
        maxDuration: 60_000, // 1 minute
        audioConfig: {
          format: AudioFormat.WAV,
          sampleRate: SampleRate.SR_16000,
          bitDepth: 16,
          channels: 1, // Mono
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec du démarrage de l'enregistrement");
    }
  };

  const handleStop = async () => {
    try {
      const result = await recorder.stopRecording();

      if (result.audioData) {
        const audioBlob = decodeBase64ToBlob(result.audioData);
        console.log("Decoded audio blob:", audioBlob.size, "bytes", audioBlob.type);
        const url = URL.createObjectURL(audioBlob);
        setDecodedBlobUrl(url);
      }

      setRecording(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'arrêt de l'enregistrement");
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        marginTop: "20px",
        borderRadius: "16px",
        background:
          "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(59,130,246,0.1))",
        border: "1px solid rgba(34,197,94,0.3)",
      }}
    >
      <h2
        style={{
          marginBottom: "16px",
          fontSize: "1.75rem",
          fontWeight: "700",
          color: "#1e293b",
        }}
      >
        🎤 Enregistreur vocal (Capacitor) - Mode simple
      </h2>

      {available !== null && (
        <div
          style={{
            fontSize: "0.9rem",
            marginBottom: "12px",
            color: available ? "#22c55e" : "#ef4444",
          }}
        >
          État :{" "}
          <strong>{available ? "✅ Disponible" : "❌ Indisponible"}</strong>
        </div>
      )}

      <div style={{ fontSize: "0.9rem", marginBottom: "12px" }}>
        Autorisation : <strong>{permission === "granted" ? "Autorisé" : permission === "denied" ? "Refusé" : permission === "prompt" ? "À demander" : permission}</strong>
      </div>

      {error && (
        <div
          style={{
            marginBottom: "12px",
            padding: "12px",
            borderRadius: "8px",
            backgroundColor: "rgba(248,113,113,0.1)",
            border: "1px solid rgba(248,113,113,0.4)",
            color: "#b91c1c",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={handleCheckPermission}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: "1px solid rgba(59,130,246,0.3)",
            backgroundColor: "rgba(59,130,246,0.1)",
            color: "#1e40af",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Vérifier l'autorisation
        </button>

        <button
          type="button"
          onClick={handleRequestPermission}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: "1px solid rgba(59,130,246,0.3)",
            backgroundColor: "rgba(59,130,246,0.1)",
            color: "#1e40af",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Demander l'autorisation
        </button>

        <button
          type="button"
          onClick={handleStart}
          disabled={isRecording}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: isRecording ? "#9ca3af" : "#22c55e",
            color: "white",
            fontWeight: 600,
            cursor: isRecording ? "not-allowed" : "pointer",
          }}
        >
          {isRecording ? "🎙️ Enregistrement..." : "▶️ Démarrer l'enregistrement"}
        </button>

        <button
          type="button"
          onClick={handleStop}
          disabled={!isRecording}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: !isRecording ? "#9ca3af" : "#ef4444",
            color: "white",
            fontWeight: 600,
            cursor: !isRecording ? "not-allowed" : "pointer",
          }}
        >
          ⏹️ Arrêter
        </button>
      </div>

      <div
        style={{ fontSize: "0.9rem", marginBottom: "8px", color: "#64748b" }}
      >
        État : <strong style={{ color: "#1e293b" }}>{state}</strong>
      </div>

      {isRecording && (
        <div
          style={{ fontSize: "0.9rem", marginBottom: "8px", color: "#64748b" }}
        >
          Durée :{" "}
          <strong style={{ color: "#1e293b" }}>
            {formatDuration(duration)}
          </strong>
        </div>
      )}

      {recording && (
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            borderRadius: "8px",
            backgroundColor: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
          }}
        >
          <h3
            style={{
              fontSize: "1.1rem",
              marginBottom: "12px",
              color: "#1e293b",
            }}
          >
            Enregistrement terminé
          </h3>
          <div
            style={{
              fontSize: "0.85rem",
              marginBottom: "12px",
              padding: "12px",
              borderRadius: "6px",
              backgroundColor: "rgba(0,0,0,0.04)",
            }}
          >
            <pre
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: "#1e293b",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {JSON.stringify(
                {
                  duration: recording.duration,
                  durationFormatted: formatDuration(recording.duration),
                  size: recording.size,
                  sizeKB: (recording.size / 1024).toFixed(2) + " KB",
                  audioConfig: recording.audioConfig,
                  checkpointCount: recording.checkpointCount,
                  timestamp: recording.timestamp,
                  audioDataLength: recording.audioData?.length || 0,
                  audioDataPreview: recording.audioData
                    ? recording.audioData.substring(0, 100) + "..."
                    : "(empty)",
                },
                null,
                2
              )}
            </pre>
          </div>
          {decodedBlobUrl && (
            <div
              style={{
                marginTop: "12px",
                padding: "12px",
                borderRadius: "6px",
                backgroundColor: "rgba(59,130,246,0.1)",
                border: "1px solid rgba(59,130,246,0.3)",
              }}
            >
              <div style={{ marginBottom: "8px", fontWeight: "600", color: "#1e293b" }}>
                Audio (blob décodé) :
              </div>
              <audio
                controls
                style={{ width: "100%", maxWidth: "500px" }}
                src={decodedBlobUrl}
              />
              <div style={{ marginTop: "8px", fontSize: "0.8rem", color: "#64748b" }}>
                URL des données audio (Base64) :
              </div>
              {
                decodedBlobUrl
              }
             
            </div>
          )}
          {recording.audioData && (
            <div>
              <div
                style={{
                  marginBottom: "12px",
                  fontSize: "0.9rem",
                  color: "#64748b",
                }}
              >
                <strong style={{ color: "#1e293b" }}>Réponse audio :</strong>
              </div>
              <audio
                controls
                style={{
                  width: "100%",
                  maxWidth: "500px",
                  marginBottom: "12px",
                }}
                src={`data:audio/wav;base64,${recording.audioData}`}
              />
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(0,0,0,0.05)",
                  fontSize: "0.85rem",
                  color: "#64748b",
                  wordBreak: "break-all",
                  maxHeight: "150px",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    marginBottom: "8px",
                    fontWeight: "600",
                    color: "#1e293b",
                  }}
                >
                  Données audio (Base64 - 200 premiers caractères) :
                </div>
                <code style={{ fontSize: "0.8rem" }}>
                  {recording.audioData.substring(0, 200)}
                  {recording.audioData.length > 200 ? "..." : ""}
                </code>
                <div style={{ marginTop: "8px", fontSize: "0.75rem" }}>
                  Longueur totale : {recording.audioData.length} caractères
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "12px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    // Create download link
                    const link = document.createElement("a");
                    const blob = new Blob(
                      [
                        Uint8Array.from(atob(recording.audioData), (c) =>
                          c.charCodeAt(0)
                        ),
                      ],
                      { type: "audio/wav" }
                    );
                    const url = URL.createObjectURL(blob);
                    link.href = url;
                    link.download = `recording-${Date.now()}.wav`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid rgba(34,197,94,0.3)",
                    backgroundColor: "rgba(34,197,94,0.1)",
                    color: "#16a34a",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  📥 Télécharger l'audio
                </button>
                <button
                  type="button"
                  onClick={() => setShowFullResponse(!showFullResponse)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid rgba(59,130,246,0.3)",
                    backgroundColor: "rgba(59,130,246,0.1)",
                    color: "#1e40af",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  {showFullResponse ? "📋 Masquer" : "📋 Afficher"} la réponse complète
                </button>
              </div>
              {showFullResponse && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    borderRadius: "6px",
                    backgroundColor: "rgba(0,0,0,0.05)",
                    fontSize: "0.85rem",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "#1e293b",
                    }}
                  >
                    Réponse d'enregistrement complète :
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      fontSize: "0.8rem",
                      color: "#64748b",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {JSON.stringify(
                      {
                        ...recording,
                        audioData: recording.audioData
                          ? `${recording.audioData.substring(0, 100)}... (${
                              recording.audioData.length
                            } caractères au total)`
                          : null,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
