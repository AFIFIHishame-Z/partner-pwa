import { useState, useEffect, useMemo } from "react";
import {
  SpeechToText,
  RecognitionState,
  Language,
  type RecognitionResult,
  type SpeechRecognitionConfig,
  type StopMode,
} from "@superapp_men/speech-to-text";

// ── Styles ────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  padding: "24px",
  marginTop: "20px",
  borderRadius: "16px",
  background:
    "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(16,185,129,0.1))",
  border: "1px solid rgba(59,130,246,0.3)",
};
const mono: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "0.78rem",
  background: "rgba(0,0,0,0.05)",
  padding: "10px 12px",
  borderRadius: "8px",
  overflowX: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
};
const label: React.CSSProperties = { fontSize: "0.8rem", color: "#64748b" };

export function SpeechToTextExample() {
  // Fresh instance after each session so native mic re-acquires properly
  const [instanceKey, setInstanceKey] = useState(0);
  const speech = useMemo(
    () => new SpeechToText({ timeout: 10000, debug: true }),
    [instanceKey]
  );

  const [state, setState] = useState<RecognitionState>(RecognitionState.IDLE);
  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [finalResult, setFinalResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [permission, setPermission] = useState("unknown");
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);

  // ── Config form state ──────────────────────────────────────────────
  const [selectedLanguage, setSelectedLanguage] = useState<string>(Language.AR_MA);
  const [stopMode, setStopMode] = useState<StopMode>("autoOnSilence");
  const [partialResults, setPartialResults] = useState(true);
  const [continuous, setContinuous] = useState(false);
  const [popup, setPopup] = useState(false);
  const [maxDuration, setMaxDuration] = useState(30000);
  const [maxAlternatives, setMaxAlternatives] = useState(3);

  const isListening =
    state === RecognitionState.LISTENING ||
    state === RecognitionState.STARTING;

  // ── Events ─────────────────────────────────────────────────────────
  useEffect(() => {
    speech.isAvailable().then(setAvailable);
    speech.checkPermission().then(setPermission);
    speech.getSupportedLanguages().then(setSupportedLanguages);

    const unsubs = [
      speech.on("stateChange", ({ state }: any) => setState(state)),
      speech.on("partialResult", ({ result }: any) => {
        setPartialTranscript(result.transcript);
      }),
      speech.on("result", ({ result }: any) => {
        setTranscript(result.transcript);
        setFinalResult(result);
        setPartialTranscript("");
      }),
      speech.on("error", ({ message }: any) => setError(message)),
      speech.on("listeningStopped", () => {
        // bump instance for next session
        setInstanceKey((k) => k + 1);
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
      speech.destroy();
    };
  }, [speech]);

  // ── Actions ────────────────────────────────────────────────────────
  const buildConfig = (): SpeechRecognitionConfig => ({
    language: selectedLanguage,
    partialResults,
    stopMode,
    continuous,
    popup,
    maxDuration,
    maxAlternatives,
  });

  const handleStart = async () => {
    try {
      setError(null);
      setTranscript("");
      setPartialTranscript("");
      setFinalResult(null);

      if (permission !== "granted") {
        const p = await speech.requestPermission();
        setPermission(p);
        if (p !== "granted") {
          setError("Microphone permission is required");
          return;
        }
      }

      const config = buildConfig();
      await speech.startListening(config);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start");
    }
  };

  const handleStop = async () => {
    try {
      const result = await speech.stopListening();
      if (result) {
        setTranscript(result.transcript);
        setFinalResult(result);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop");
    }
  };

  return (
    <div style={card}>
      <h2
        style={{
          marginBottom: "16px",
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "#1e293b",
        }}
      >
        Speech-to-Text
      </h2>

      {/* ── Status line ── */}
      <div style={{ fontSize: "0.9rem", marginBottom: "8px" }}>
        Device:{" "}
        <strong style={{ color: available ? "#22c55e" : "#ef4444" }}>
          {available === null ? "..." : available ? "Available" : "N/A"}
        </strong>{" "}
        | Permission: <strong>{permission}</strong> | State:{" "}
        <strong>{state}</strong>
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

      {/* ── Config panel ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "16px",
          padding: "12px",
          borderRadius: "8px",
          background: "rgba(255,255,255,0.6)",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {/* Language */}
        <div>
          <div style={label}>Language</div>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={isListening}
            style={{ width: "100%", padding: "6px", borderRadius: "6px" }}
          >
            {supportedLanguages.length > 0
              ? supportedLanguages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))
              : Object.values(Language).map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
          </select>
        </div>

        {/* Stop mode */}
        <div>
          <div style={label}>Stop Mode</div>
          <select
            value={stopMode}
            onChange={(e) => setStopMode(e.target.value as StopMode)}
            disabled={isListening}
            style={{ width: "100%", padding: "6px", borderRadius: "6px" }}
          >
            <option value="autoOnSilence">Auto (stop on silence)</option>
            <option value="manual">Manual (button to stop)</option>
          </select>
        </div>

        {/* Partial results */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <input
            type="checkbox"
            checked={partialResults}
            onChange={(e) => setPartialResults(e.target.checked)}
            disabled={isListening}
          />
          <span style={label}>Partial Results (real-time)</span>
        </div>

        {/* Continuous */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <input
            type="checkbox"
            checked={continuous}
            onChange={(e) => setContinuous(e.target.checked)}
            disabled={isListening}
          />
          <span style={label}>Continuous (keep mic open)</span>
        </div>

        {/* Max duration */}
        <div>
          <div style={label}>Max Duration (ms)</div>
          <input
            type="number"
            value={maxDuration}
            onChange={(e) => setMaxDuration(Number(e.target.value))}
            disabled={isListening}
            style={{ width: "100%", padding: "6px", borderRadius: "6px" }}
            min={1000}
            step={1000}
          />
        </div>

        {/* Max alternatives */}
        <div>
          <div style={label}>Max Alternatives</div>
          <input
            type="number"
            value={maxAlternatives}
            onChange={(e) => setMaxAlternatives(Number(e.target.value))}
            disabled={isListening}
            style={{ width: "100%", padding: "6px", borderRadius: "6px" }}
            min={1}
            max={10}
          />
        </div>

        {/* Popup */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <input
            type="checkbox"
            checked={popup}
            onChange={(e) => setPopup(e.target.checked)}
            disabled={isListening}
          />
          <span style={label}>Native OS Popup</span>
        </div>
      </div>

      {/* ── Requested config (reference) ── */}
      <details style={{ marginBottom: "12px" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, color: "#475569" }}>
          Requested Config
        </summary>
        <pre style={mono}>{JSON.stringify(buildConfig(), null, 2)}</pre>
      </details>

      {/* ── Buttons ── */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <Btn onClick={handleStart} disabled={isListening} color="green">
          {isListening ? "Listening..." : "Start Listening"}
        </Btn>
        <Btn onClick={handleStop} disabled={!isListening} color="red">
          Stop
        </Btn>
      </div>

      {/* ── Live partial transcript ── */}
      {partialTranscript && (
        <div
          style={{
            padding: "12px",
            borderRadius: "8px",
            backgroundColor: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.3)",
            marginBottom: "12px",
          }}
        >
          <div style={{ ...label, marginBottom: "4px" }}>Partial (real-time):</div>
          <div style={{ fontSize: "1rem", color: "#1e293b", fontWeight: 500 }}>
            {partialTranscript}
          </div>
        </div>
      )}

      {/* ── Final transcript ── */}
      {transcript && (
        <div
          style={{
            padding: "12px",
            borderRadius: "8px",
            backgroundColor: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
            marginBottom: "12px",
          }}
        >
          <div style={{ ...label, marginBottom: "4px" }}>Final Transcript:</div>
          <div
            style={{ fontSize: "1.1rem", color: "#1e293b", fontWeight: 600 }}
            dir="auto"
          >
            {transcript}
          </div>
        </div>
      )}

      {/* ── Full result JSON ── */}
      {finalResult && (
        <details style={{ marginBottom: "12px" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, color: "#475569" }}>
            Raw Result JSON
          </summary>
          <pre style={mono}>{JSON.stringify(finalResult, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

// ── Btn ──────────────────────────────────────────────────────────────────
function Btn({
  onClick,
  disabled,
  color,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  color: "green" | "red";
  children: React.ReactNode;
}) {
  const colors: Record<string, { bg: string; text: string }> = {
    green: { bg: "#22c55e", text: "white" },
    red: { bg: "#ef4444", text: "white" },
  };
  const c = colors[color];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 18px",
        borderRadius: "8px",
        border: "none",
        backgroundColor: disabled ? "#9ca3af" : c.bg,
        color: disabled ? "white" : c.text,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
