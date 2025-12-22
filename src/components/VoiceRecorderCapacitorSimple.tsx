import { useEffect, useState } from "react";
import {
  VoiceRecorder,
  RecorderState,
  PermissionStatus,
  formatDuration,
  AudioFormat,
  SampleRate,
  type RecordingResult,
} from "@superapp_men/voice-recorder-capacitor";

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

  useEffect(() => {
    // Check availability on mount
    recorder.isAvailable().then(setAvailable);

    // State changes
    const unsubState = recorder.on("stateChange", ({ state }: any) => {
      setState(state);
    });

    // Progress updates
    const unsubProgress = recorder.on("progress", ({ duration }: any) => {
      setDuration(duration);
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
      setError(e instanceof Error ? e.message : "Failed to check permission");
    }
  };

  const handleRequestPermission = async () => {
    try {
      const status = await recorder.requestPermission();
      setPermission(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to request permission");
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
          setError("Microphone permission is required");
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
      setError(e instanceof Error ? e.message : "Failed to start recording");
    }
  };

  const handleStop = async () => {
    try {
      const result = await recorder.stopRecording();
      setRecording(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to stop recording");
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
        🎤 Voice Recorder (Capacitor) - Simple Mode
      </h2>

      {available !== null && (
        <div style={{ fontSize: "0.9rem", marginBottom: "12px", color: available ? "#22c55e" : "#ef4444" }}>
          Status: <strong>{available ? "✅ Available" : "❌ Not Available"}</strong>
        </div>
      )}

      <div style={{ fontSize: "0.9rem", marginBottom: "12px" }}>
        Permission: <strong>{permission}</strong>
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

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
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
          Check Permission
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
          Request Permission
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
          {isRecording ? "🎙️ Recording..." : "▶️ Start Recording"}
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
          ⏹️ Stop
        </button>
      </div>

      <div style={{ fontSize: "0.9rem", marginBottom: "8px", color: "#64748b" }}>
        State: <strong style={{ color: "#1e293b" }}>{state}</strong>
      </div>

      {isRecording && (
        <div style={{ fontSize: "0.9rem", marginBottom: "8px", color: "#64748b" }}>
          Duration: <strong style={{ color: "#1e293b" }}>{formatDuration(duration)}</strong>
        </div>
      )}

      {recording && (
        <div style={{ marginTop: "16px", padding: "16px", borderRadius: "8px", backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
          <h3 style={{ fontSize: "1.1rem", marginBottom: "12px", color: "#1e293b" }}>
            Recording Complete
          </h3>
          <div style={{ fontSize: "0.9rem", marginBottom: "12px", color: "#64748b" }}>
            Duration: <strong style={{ color: "#1e293b" }}>{formatDuration(recording.duration)}</strong>
            <br />
            Size: <strong style={{ color: "#1e293b" }}>{(recording.size / 1024).toFixed(2)} KB</strong>
            <br />
            Format: <strong style={{ color: "#1e293b" }}>{recording.audioConfig?.format || "wav"}</strong>
            <br />
            Sample Rate: <strong style={{ color: "#1e293b" }}>{recording.audioConfig?.sampleRate || 16000} Hz</strong>
          </div>
          {recording.audioData && (
            <audio
              controls
              style={{ width: "100%", maxWidth: "500px" }}
              src={`data:audio/wav;base64,${recording.audioData}`}
            />
          )}
        </div>
      )}
    </div>
  );
}

