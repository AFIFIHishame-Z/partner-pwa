import { useEffect, useState } from "react";
import {
  VoiceRecorder,
  RecorderState,
  formatDuration,
  AudioFormat,
  SampleRate,
  type RecordingResult,
  type Checkpoint,
  type PermissionStatus,
  type StateChangeEvent,
  type ProgressEvent,
  type CheckpointCreatedEvent,
  type ErrorEvent,
} from "@superapp_men/voice-recorder-capacitor";

// ── Requested config.. (displayed in the UI so you can compare with responses) ──
const REQUESTED_CONFIG = {
  isCheckpoints: true,
  useModelAi:true,
  checkpointInterval: 1000,
  maxDuration: 120_000,
  audioConfig: {
    format: AudioFormat.WAV,
    sampleRate: SampleRate.SR_16000,
    bitDepth: 16,
    channels: 1,
  },
};

// ── Styles ────────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  padding: "24px",
  marginTop: "20px",
  borderRadius: "16px",
  background:
    "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))",
  border: "1px solid rgba(139,92,246,0.3)",
};
const label: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#64748b",
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
const aiCard: React.CSSProperties = {
  marginTop: "12px",
  padding: "12px",
  borderRadius: "10px",
  background: "rgba(14,165,233,0.08)",
  border: "1px solid rgba(14,165,233,0.2)",
};
const configBadge = (match: boolean): React.CSSProperties => ({
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: "4px",
  fontSize: "0.75rem",
  fontWeight: 600,
  marginLeft: "6px",
  background: match ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
  color: match ? "#15803d" : "#b91c1c",
});

type RecordingLanguage = "fr" | "ar";

export function VoiceRecorderCapacitorWithCheckpoints() {
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
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [selectedLanguage, setSelectedLanguage] =
    useState<RecordingLanguage>("fr");

  useEffect(() => {
    recorder.isAvailable().then(setAvailable);

    const unsubState = recorder.on<StateChangeEvent>("stateChange", ({ state }) =>
      setState(state)
    );
    const unsubProgress = recorder.on<ProgressEvent>("progress", ({ duration }) =>
      setDuration(duration)
    );
    const unsubCheckpoint = recorder.on<CheckpointCreatedEvent>(
      "checkpointCreated",
      ({ checkpoint }) => {
        setCheckpoints((prev) => [...prev, checkpoint]);
      }
    );
    const unsubError = recorder.on<ErrorEvent>("error", ({ message }) =>
      setError(message)
    );

    return () => {
      unsubState();
      unsubProgress();
      unsubCheckpoint();
      unsubError();
      recorder.destroy();
    };
  }, [recorder]);

  const isRecording = state === RecorderState.RECORDING;
  const requestedConfigWithLanguage = {
    ...REQUESTED_CONFIG,
    lang: selectedLanguage,
  };

  const handleCheckPermission = async () => {
    try {
      setPermission(await recorder.checkPermission());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to check permission");
    }
  };

  const handleRequestPermission = async () => {
    try {
      setPermission(await recorder.requestPermission());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to request permission"
      );
    }
  };

  const handleStart = async () => {
    try {
      setError(null);
      setRecording(null);
      setCheckpoints([]);

      if (permission !== "granted") {
        const p = await recorder.requestPermission();
        setPermission(p);
        if (p !== "granted") {
          setError("Microphone permission is required");
          return;
        }
      }

      await recorder.startRecording(requestedConfigWithLanguage as any);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start recording");
    }
  };

  const handleStop = async () => {
    try {
      const result = await recorder.stopRecording();
      setRecording(result);
      setCheckpoints(result.checkpoints || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop recording");
    }
  };

  return (
    <div style={card}>
      <h2
        style={{
          marginBottom: "16px",
          fontSize: "1.75rem",
          fontWeight: "700",
          color: "#1e293b",
        }}
      >
        Voice Recorder &mdash; Auto Checkpoints
      </h2>

      {/* ── Availability / Permission / State ── */}
      {available !== null && (
        <div
          style={{
            fontSize: "0.9rem",
            marginBottom: "8px",
            color: available ? "#22c55e" : "#ef4444",
          }}
        >
          Device: <strong>{available ? "Available" : "Not Available"}</strong>
        </div>
      )}
      <div style={{ fontSize: "0.9rem", marginBottom: "8px" }}>
        Permission: <strong>{permission}</strong> &nbsp;|&nbsp; State:{" "}
        <strong>{state}</strong>
      </div>
      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "0.9rem",
          marginBottom: "8px",
          color: "#475569",
        }}
      >
        AI language:
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
          <option value="fr">French (fr)</option>
          <option value="ar">Arabic (ar)</option>
        </select>
      </label>
      {isRecording && (
        <div style={{ fontSize: "0.9rem", marginBottom: "8px" }}>
          Duration:{" "}
          <strong style={{ color: "#1e293b" }}>
            {formatDuration(duration)}
          </strong>
        </div>
      )}

      {/* ── Error ── */}
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

      {/* ── Buttons ── */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <Btn onClick={handleCheckPermission} color="blue">
          Check Permission
        </Btn>
        <Btn onClick={handleRequestPermission} color="blue">
          Request Permission
        </Btn>
        <Btn onClick={handleStart} disabled={isRecording} color="green">
          {isRecording ? "Recording..." : "Start Recording"}
        </Btn>
        <Btn onClick={handleStop} disabled={!isRecording} color="red">
          Stop
        </Btn>
      </div>

      {/* ── Requested Config (reference) ── */}
      <details style={{ marginBottom: "16px" }}>
        <summary
          style={{ cursor: "pointer", fontWeight: 600, color: "#475569" }}
        >
          Requested Config
        </summary>
        <pre style={mono}>{JSON.stringify(requestedConfigWithLanguage, null, 2)}</pre>
      </details>

      {/* ── Live Checkpoints ── */}
      {checkpoints.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>
            Checkpoints ({checkpoints.length})
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {checkpoints.map((cp) => (
              <CheckpointCard
                key={cp.id}
                checkpoint={cp}
                requestedConfig={REQUESTED_CONFIG.audioConfig}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Final Recording Result ── */}
      {recording && (
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            borderRadius: "12px",
            backgroundColor: "rgba(34,197,94,0.08)",
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
            Final Recording Result
          </h3>

          {/* Config comparison */}
          <ConfigComparison
            label="Final audioConfig"
            actual={recording.audioConfig}
            requested={REQUESTED_CONFIG.audioConfig}
          />

          {/* Metadata */}
          <div
            style={{
              fontSize: "0.85rem",
              marginTop: "10px",
              marginBottom: "10px",
              color: "#64748b",
            }}
          >
            Duration:{" "}
            <strong style={{ color: "#1e293b" }}>
              {formatDuration(recording.duration)}
            </strong>
            &nbsp;|&nbsp; Size:{" "}
            <strong style={{ color: "#1e293b" }}>
              {(recording.size / 1024).toFixed(2)} KB
            </strong>
            &nbsp;|&nbsp; Checkpoints:{" "}
            <strong style={{ color: "#1e293b" }}>
              {recording.checkpointCount || 0}
            </strong>
          </div>

          <AiResultPanel
            title="Final AI Result"
            result={recording.modelAiResult}
            emptyLabel="No AI result returned for the full recording."
          />

          {/* Raw JSON */}
          <details>
            <summary
              style={{ cursor: "pointer", fontWeight: 600, color: "#475569" }}
            >
              Raw Response JSON
            </summary>
            <pre style={mono}>
              {JSON.stringify(
                { ...recording, audioData: `[${recording.audioData.length} chars]` },
                null,
                2
              )}
            </pre>
          </details>

          {/* Audio player */}
          {recording.audioData && (
            <div style={{ marginTop: "12px" }}>
              <p style={{ ...label, marginBottom: "6px" }}>
                Complete Recording:
              </p>
              <audio
                controls
                style={{ width: "100%", maxWidth: "500px" }}
                src={`data:audio/wav;base64,${recording.audioData}`}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CheckpointCard({
  checkpoint,
  requestedConfig,
}: {
  checkpoint: Checkpoint;
  requestedConfig: typeof REQUESTED_CONFIG.audioConfig;
}) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: "rgba(139,92,246,0.08)",
        border: "1px solid rgba(139,92,246,0.25)",
      }}
    >
      <div style={{ fontSize: "0.85rem", marginBottom: "6px" }}>
        <strong>Checkpoint #{checkpoint.index}</strong>
      </div>

      {/* Config match badges */}
      <ConfigComparison
        label={`CP #${checkpoint.index} audioConfig`}
        actual={checkpoint.audioConfig}
        requested={requestedConfig}
      />

      {/* Stats */}
      <div
        style={{
          marginTop: "6px",
          fontSize: "0.8rem",
          color: "#64748b",
        }}
      >
        Segment: {formatDuration(checkpoint.segmentDuration)} &nbsp;|&nbsp;
        Elapsed: {formatDuration(checkpoint.duration)} &nbsp;|&nbsp; Size:{" "}
        {(checkpoint.size / 1024).toFixed(2)} KB
      </div>

      <AiResultPanel
        title={`Checkpoint #${checkpoint.index} AI Result`}
        result={checkpoint.modelAiResult}
        emptyLabel="No AI result returned for this checkpoint."
      />

      {/* Raw JSON */}
      <details style={{ marginTop: "6px" }}>
        <summary style={{ cursor: "pointer", fontSize: "0.78rem", color: "#64748b" }}>
          Raw JSON
        </summary>
        <pre style={{ ...mono, fontSize: "0.72rem" }}>
          {JSON.stringify(
            { ...checkpoint, audioData: `[${checkpoint.audioData.length} chars]` },
            null,
            2
          )}
        </pre>
      </details>

      {/* Audio player */}
      <audio
        controls
        src={`data:audio/wav;base64,${checkpoint.audioData}`}
        style={{ width: "100%", maxWidth: "400px", marginTop: "8px" }}
      />
    </div>
  );
}

function AiResultPanel({
  title,
  result,
  emptyLabel,
}: {
  title: string;
  result: unknown;
  emptyLabel: string;
}) {
  const highlights = extractAiHighlights(result);
  const prettyJson = stringifyAiResult(result);
  const hasResult = result !== undefined && result !== null;

  return (
    <div style={aiCard}>
      <div
        style={{
          fontSize: "0.9rem",
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
          {hasResult ? "AI response received, but no readable text was detected." : emptyLabel}
        </div>
      )}

      {hasResult && (
        <details style={{ marginTop: "10px" }}>
          <summary style={{ cursor: "pointer", fontSize: "0.8rem", color: "#0369a1" }}>
            Raw AI payload
          </summary>
          <pre style={{ ...mono, marginTop: "8px", fontSize: "0.72rem" }}>
            {prettyJson}
          </pre>
        </details>
      )}
    </div>
  );
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

/**
 * Shows each audioConfig field side-by-side with a match/mismatch badge.
 */
function ConfigComparison({
  label: sectionLabel,
  actual,
  requested,
}: {
  label: string;
  actual: { format?: string; sampleRate?: number; bitDepth?: number; channels?: number };
  requested: { format: string; sampleRate: number; bitDepth: number; channels: number };
}) {
  const fields: { key: string; req: string | number; act: string | number | undefined }[] = [
    { key: "format", req: requested.format, act: actual.format },
    { key: "sampleRate", req: requested.sampleRate, act: actual.sampleRate },
    { key: "bitDepth", req: requested.bitDepth, act: actual.bitDepth },
    { key: "channels", req: requested.channels, act: actual.channels },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        alignItems: "center",
        fontSize: "0.8rem",
      }}
    >
      <span style={{ ...label, marginRight: "4px" }}>{sectionLabel}:</span>
      {fields.map((f) => {
        const match = String(f.act) === String(f.req);
        return (
          <span key={f.key}>
            <span style={{ color: "#334155" }}>{f.key}=</span>
            <strong style={{ color: match ? "#15803d" : "#b91c1c" }}>
              {String(f.act ?? "?")}
            </strong>
            <span style={configBadge(match)}>
              {match ? "OK" : `expected ${f.req}`}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function Btn({
  onClick,
  disabled,
  color,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  color: "blue" | "green" | "red";
  children: React.ReactNode;
}) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    blue: {
      bg: "rgba(59,130,246,0.1)",
      border: "1px solid rgba(59,130,246,0.3)",
      text: "#1e40af",
    },
    green: { bg: "#22c55e", border: "none", text: "white" },
    red: { bg: "#ef4444", border: "none", text: "white" },
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
        border: disabled ? "none" : c.border,
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
