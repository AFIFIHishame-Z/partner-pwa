import { useEffect, useState } from "react";
import {
  VoiceRecorder,
  RecorderState,
  type PermissionStatus,
  formatDuration,
  AudioFormat,
  SampleRate,
  type RecordingResult,
  type StateChangeEvent,
  type ProgressEvent,
  type ErrorEvent,
} from "@superapp_men/voice-recorder-capacitor";
//ddd
function decodeBase64ToBlob(base64: string, mimeType = "audio/wav"): Blob {
  const byteString = atob(base64);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([byteArray], { type: mimeType });
}

const mono: React.CSSProperties = {
  margin: 0,
  fontSize: "0.8rem",
  color: "#64748b",
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
};

const aiCard: React.CSSProperties = {
  marginBottom: "12px",
  padding: "12px",
  borderRadius: "8px",
  background: "rgba(14,165,233,0.08)",
  border: "1px solid rgba(14,165,233,0.2)",
};

type RecordingLanguage = "fr" | "ar" | "math";
type Audio2PhonemeResult = NonNullable<RecordingResult["modelAiResult"]>;

export function VoiceRecorderCapacitorSimple() {
  const [recorder] = useState(
    () =>
      new VoiceRecorder({
        timeout: 100000,
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
  const [selectedLanguage, setSelectedLanguage] =
    useState<RecordingLanguage>("fr");
  const [referenceText, setReferenceText] = useState("");
  const [expectedNumber, setExpectedNumber] = useState("12");

  useEffect(() => {
    // Check availability on mount
    recorder.isAvailable().then(setAvailable);
console.log("test stateChange");

    // State changes
    const unsubState = recorder.on<StateChangeEvent>("stateChange", ({ state }) => {
      setState(state);
      console.log("test stateChange 2");

      console.log("stateChange : " + JSON.stringify(state));
    });

    // Progress updates
    const unsubProgress = recorder.on<ProgressEvent>("progress", ({ duration }) => {
      setDuration(duration);
      console.log("progress : " + JSON.stringify(duration));
    });

    // Error handling
    const unsubError = recorder.on<ErrorEvent>("error", ({ message }) => {
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

      const trimmedReferenceText = referenceText.trim();
      if (selectedLanguage === "ar" && !trimmedReferenceText) {
        setError("Le texte de référence est obligatoire pour l'arabe.");
        return;
      }

      const normalizedExpectedNumber = normalizeExpectedNumber(expectedNumber);
      if (selectedLanguage === "math" && normalizedExpectedNumber === null) {
        setError("Le nombre attendu doit etre un entier entre 0 et 99.");
        return;
      }

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
        useModelAi: true,
        lang: selectedLanguage,
        ...(selectedLanguage === "ar"
          ? { referenceText: trimmedReferenceText }
          : selectedLanguage === "math" && normalizedExpectedNumber !== null
            ? {
                referenceText: String(normalizedExpectedNumber),
                metadata: { expectedNumber: normalizedExpectedNumber },
              }
          : {}),
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

      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "0.9rem",
          marginBottom: "12px",
          color: "#475569",
        }}
      >
        Langue IA :
        <select
          value={selectedLanguage}
          disabled={isRecording}
          onChange={(event) =>
            setSelectedLanguage(event.target.value as RecordingLanguage)
          }
          style={{
            padding: "8px 10px",
            borderRadius: "8px",
            border: "1px solid rgba(59,130,246,0.3)",
            backgroundColor: "white",
            color: "#1e293b",
            fontWeight: 600,
          }}
        >
          <option value="fr">Français (fr)</option>
          <option value="ar">Arabe (ar)</option>
          <option value="math">Math numbers (math)</option>
        </select>
      </label>

      {selectedLanguage === "ar" && (
        <label
          style={{
            display: "grid",
            gap: "8px",
            fontSize: "0.9rem",
            marginBottom: "12px",
            color: "#475569",
            maxWidth: "520px",
          }}
        >
          Texte de référence arabe :
          <textarea
            dir="rtl"
            rows={3}
            disabled={isRecording}
            value={referenceText}
            onChange={(event) => setReferenceText(event.target.value)}
            placeholder="اكتب النص العربي المتوقع هنا"
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(59,130,246,0.3)",
              backgroundColor: "white",
              color: "#1e293b",
              resize: "vertical",
            }}
          />
        </label>
      )}

      {selectedLanguage === "math" && (
        <label
          style={{
            display: "grid",
            gap: "8px",
            fontSize: "0.9rem",
            marginBottom: "12px",
            color: "#475569",
            maxWidth: "260px",
          }}
        >
          Nombre attendu (0-99) :
          <input
            type="number"
            min={0}
            max={99}
            disabled={isRecording}
            value={expectedNumber}
            onChange={(event) => setExpectedNumber(event.target.value)}
            placeholder="12"
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(59,130,246,0.3)",
              backgroundColor: "white",
              color: "#1e293b",
            }}
          />
        </label>
      )}

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
          <AiResultPanel
            title="Résultat IA final"
            result={recording.modelAiResult}
            emptyLabel="Aucun résultat IA n'a été retourné pour cet enregistrement."
          />
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

function AiResultPanel({
  title,
  result,
  emptyLabel,
}: {
  title: string;
  result?: Audio2PhonemeResult;
  emptyLabel: string;
}) {
  if (result && isFrenchAiResult(result)) {
    const phonemes = result.timestamps ?? [];

    return (
      <div style={aiCard}>
        <div
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "8px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.72)",
            color: "#0f172a",
            lineHeight: 1.5,
            marginBottom: "10px",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "4px" }}>
            Transcript
          </div>
          <strong>{result.transcript || "(empty)"}</strong>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "8px",
          }}
        >
          <AiMetric label="Confidence" value={formatConfidence(result.confidence)} />
          <AiMetric label="Latency" value={formatMs(result.latencyMs)} />
          <AiMetric label="Language" value={result.language} />
          <AiMetric label="Model" value={result.modelVersion} />
          <AiMetric label="Audio duration" value={formatMs(result.audio.durationMs)} />
          <AiMetric label="Sample rate" value={`${result.audio.sampleRateHz} Hz`} />
          <AiMetric label="Channels" value={String(result.audio.channels)} />
          <AiMetric label="Encoding" value={result.audio.encoding} />
        </div>

        {phonemes.length > 0 && (
          <details style={{ marginTop: "10px" }}>
            <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#0369a1" }}>
              Phoneme timestamps ({phonemes.length})
            </summary>
            <div style={{ display: "grid", gap: "6px", marginTop: "8px", maxHeight: "220px", overflowY: "auto" }}>
              {phonemes.map((item, index) => (
                <div
                  key={`${item.phoneme}-${item.startMs}-${index}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px",
                    padding: "8px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.65)",
                    fontSize: "0.78rem",
                  }}
                >
                  <strong>{item.phoneme}</strong>
                  <span>
                    {formatMs(item.startMs)} - {formatMs(item.endMs)}
                  </span>
                  <span>{formatConfidence(item.confidence)}</span>
                </div>
              ))}
            </div>
          </details>
        )}

        <details style={{ marginTop: "10px" }}>
          <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#0369a1" }}>
            Payload IA brut
          </summary>
          <pre style={{ ...mono, marginTop: "8px" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  if (result && isArabicAiResult(result)) {
    return (
      <div style={aiCard}>
        <div
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "8px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "8px",
          }}
        >
          <AiMetric label="Accepted" value={result.accepted ? "Yes" : "No"} />
          <AiMetric label="Label" value={result.label} />
          <AiMetric label="Score" value={`${result.scorePercent.toFixed(1)}%`} />
          <AiMetric label="Version" value={result.assessmentVersion} />
        </div>

        {result.words.length > 0 && (
          <details open style={{ marginTop: "10px" }}>
            <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#0369a1" }}>
              Arabic words ({result.words.length})
            </summary>
            <div style={{ display: "grid", gap: "6px", marginTop: "8px", maxHeight: "220px", overflowY: "auto" }}>
              {result.words.map((word) => (
                <div
                  key={word.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "8px",
                    padding: "8px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.65)",
                    fontSize: "0.78rem",
                  }}
                >
                  <strong>{word.referenceWord}</strong>
                  <span>{word.producedText || "(empty)"}</span>
                  <span>{word.status}</span>
                  {word.faults.length > 0 && (
                    <span style={{ gridColumn: "1 / -1", color: "#b91c1c" }}>
                      Faults: {word.faults.join(", ")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}

        {result.faults.length > 0 && (
          <div style={{ marginTop: "10px", color: "#b91c1c", fontSize: "0.82rem" }}>
            Faults: {result.faults.join(", ")}
          </div>
        )}

        <details style={{ marginTop: "10px" }}>
          <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#0369a1" }}>
            Arabic debug / raw payload
          </summary>
          <pre style={{ ...mono, marginTop: "8px" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  if (result && isMathAiResult(result)) {
    return (
      <div style={aiCard}>
        <div
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "8px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "8px",
          }}
        >
          <AiMetric label="Expected" value={String(result.expected.number)} />
          <AiMetric label="Expected score" value={formatScore(result.expected.score)} />
          <AiMetric label="Expected rank" value={String(result.expected.rank)} />
          <AiMetric label="Most likely" value={String(result.mostLikely?.number ?? "none")} />
          <AiMetric label="Most likely score" value={formatScore(result.mostLikely?.score ?? 0)} />
          <AiMetric label="Detected" value={result.hasDetection ? "Yes" : "No"} />
        </div>

        <div
          style={{
            marginTop: "10px",
            padding: "10px 12px",
            borderRadius: "8px",
            background: result.expected.isMostLikely
              ? "rgba(34,197,94,0.12)"
              : "rgba(245,158,11,0.14)",
            color: "#0f172a",
            fontWeight: 700,
          }}
        >
          {result.expected.isMostLikely
            ? "Expected number is the best match."
            : "Expected number is not the best match."}
        </div>

        {result.detectedTokens.length > 0 && (
          <div style={{ marginTop: "10px" }}>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "4px" }}>
              Detected SWS tokens
            </div>
            <pre style={mono}>{result.detectedTokens.join(" ")}</pre>
          </div>
        )}

        {result.likelyNumbers.length > 0 && (
          <details open style={{ marginTop: "10px" }}>
            <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#0369a1" }}>
              Likely numbers ({result.likelyNumbers.length})
            </summary>
            <div style={{ display: "grid", gap: "6px", marginTop: "8px", maxHeight: "220px", overflowY: "auto" }}>
              {result.likelyNumbers.map((candidate) => (
                <div
                  key={`${candidate.number}-${candidate.rank}-${candidate.score}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 1fr",
                    gap: "8px",
                    padding: "8px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.65)",
                    fontSize: "0.78rem",
                  }}
                >
                  <strong>{candidate.number}</strong>
                  <span>rank {candidate.rank}</span>
                  <span>{formatScore(candidate.score)}</span>
                </div>
              ))}
            </div>
          </details>
        )}

        <details style={{ marginTop: "10px" }}>
          <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#0369a1" }}>
            Math raw payload
          </summary>
          <pre style={{ ...mono, marginTop: "8px" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  const highlights = extractAiHighlights(result);
  const prettyJson = stringifyAiResult(result);
  const hasResult = result !== undefined && result !== null;

  return (
    <div style={aiCard}>
      <div
        style={{
          fontSize: "0.95rem",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      {highlights.length > 0 ? (
        <div style={{ display: "grid", gap: "8px" }}>
          {highlights.map((highlight, index) => (
            <div
              key={`${title}-${index}`}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(255,255,255,0.72)",
                color: "#0f172a",
                lineHeight: 1.5,
              }}
            >
              {highlight}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#475569", fontSize: "0.85rem" }}>
          {hasResult ? "Réponse IA reçue, mais aucun texte lisible n'a été détecté." : emptyLabel}
        </div>
      )}

      {hasResult && (
        <details style={{ marginTop: "10px" }}>
          <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#0369a1" }}>
            Payload IA brut
          </summary>
          <pre style={{ ...mono, marginTop: "8px" }}>{prettyJson}</pre>
        </details>
      )}
    </div>
  );
}

function isFrenchAiResult(
  result: Audio2PhonemeResult
): result is Extract<Audio2PhonemeResult, { transcript: string }> {
  return "transcript" in result;
}

function isArabicAiResult(
  result: Audio2PhonemeResult
): result is Extract<Audio2PhonemeResult, { accepted: boolean }> {
  return "accepted" in result;
}

function isMathAiResult(
  result: Audio2PhonemeResult
): result is Extract<Audio2PhonemeResult, { expected: unknown }> {
  return "expected" in result && "likelyNumbers" in result;
}

function normalizeExpectedNumber(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 99) {
    return null;
  }
  return parsed;
}

const AI_TEXT_KEYS = [
  "text",
  "result",
  "response",
  "transcript",
  "summary",
  "message",
  "content",
  "output",
  "answer",
];

function extractAiHighlights(value: unknown, depth = 0): string[] {
  if (depth > 4 || value == null) {
    return [];
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return dedupeStrings(value.flatMap((item) => extractAiHighlights(item, depth + 1)));
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = AI_TEXT_KEYS.flatMap((key) =>
      key in record ? extractAiHighlights(record[key], depth + 1) : []
    );

    if (preferred.length > 0) {
      return dedupeStrings(preferred);
    }

    return dedupeStrings(
      Object.values(record).flatMap((entry) => extractAiHighlights(entry, depth + 1))
    );
  }

  return [];
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function stringifyAiResult(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function AiMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: "8px",
        background: "rgba(255,255,255,0.66)",
      }}
    >
      <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: "3px" }}>
        {label}
      </div>
      <strong style={{ color: "#0f172a", fontSize: "0.84rem" }}>{value}</strong>
    </div>
  );
}

function formatConfidence(value: number): string {
  const normalized = value <= 1 ? value * 100 : value;
  return `${normalized.toFixed(1)}%`;
}

function formatScore(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMs(value: number): string {
  return `${Math.round(value)} ms`;
}
