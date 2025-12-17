import { useState, useEffect } from "react";
import {
  SpeechToText,
  RecognitionState,
  Language,
} from "@superapp_men/speech-to-text";

export function SpeechToTextExample() {
  const [speech] = useState(
    () =>
      new SpeechToText({
        timeout: 10000,
        debug: true,
      })
  );

  const [state, setState] = useState<RecognitionState>(RecognitionState.IDLE);
  const [isListening, setIsListening] = useState(false);

  // Log every render
  console.log(
    "[superapp] [React] 🔄 Component rendering - state:",
    state,
    "isListening:",
    isListening
  );
  const [transcript, setTranscript] = useState<string>("");
  const [partialTranscript, setPartialTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<string>("unknown");
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    Language.EN_US
  );

  useEffect(() => {
    // Listen to state changes
    const unsubState = speech.on("stateChange", ({ state }: any) => {
      console.log("[superapp] [React] stateChange event received:", state);
      console.log("[superapp] [React] About to call setState with:", state);
      setState(state);
      console.log("[superapp] [React] setState called");
      setIsListening(state === RecognitionState.LISTENING);
      console.log(
        "[superapp] [React] setIsListening called with:",
        state === RecognitionState.LISTENING
      );
      console.log(
        "[superapp] [React] State updated to:",
        state,
        "isListening:",
        state === RecognitionState.LISTENING
      );
    });

    // Listen to partial results
    const unsubPartial = speech.on("partialResult", ({ result }: any) => {
      console.log("[superapp] [React] partialResult event:", result.transcript);
      setPartialTranscript(result.transcript);
    });

    // Listen to final results
    const unsubResult = speech.on("result", ({ result }: any) => {
      console.log("[superapp] [React] result event:", result.transcript);
      setTranscript(result.transcript);
      setPartialTranscript("");
    });

    // Listen to errors
    const unsubError = speech.on("error", ({ message }: any) => {
      console.log("[superapp] [React] error event:", message);
      setError(message);
    });

    // Listen to listening started
    const unsubStarted = speech.on("listeningStarted", () => {
      console.log("[superapp] [React] listeningStarted event");
    });

    // Listen to listening stopped
    const unsubStopped = speech.on("listeningStopped", ({ duration }: any) => {
      console.log(
        "[superapp] [React] listeningStopped event, duration:",
        duration
      );
    });

    return () => {
      unsubState();
      unsubPartial();
      unsubResult();
      unsubError();
      unsubStarted();
      unsubStopped();
      speech.destroy();
    };
  }, [speech]);

  // Check availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const isAvailable = await speech.isAvailable();
        setAvailable(isAvailable);

        if (isAvailable) {
          const languages = await speech.getSupportedLanguages();
          setSupportedLanguages(languages);

          const permStatus = await speech.checkPermission();
          setPermission(permStatus);
        }
      } catch (err) {
        console.error("Error checking availability:", err);
        setAvailable(false);
      }
    };

    checkAvailability();
  }, [speech]);

  const handleRequestPermission = async () => {
    try {
      setError(null);
      const status = await speech.requestPermission();
      setPermission(status);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to request permission"
      );
    }
  };

  const handleStartListening = async () => {
    try {
      setError(null);
      setTranscript("");
      setPartialTranscript("");

      if (permission !== "granted") {
        const status = await speech.requestPermission();
        setPermission(status);
        if (status !== "granted") {
          setError("Microphone permission is required");
          return;
        }
      }

      await speech.startListening({
        language: selectedLanguage,
        partialResults: true,
        popup: false, // Partner app manages its own UI
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start listening"
      );
    }
  };

  const getStateColor = () => {
    switch (state) {
      case RecognitionState.LISTENING:
        return "#4caf50";
      case RecognitionState.ERROR:
        return "#f44336";
      case RecognitionState.STARTING:
      case RecognitionState.PROCESSING:
        return "#ff9800";
      default:
        return "#9e9e9e";
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2 style={{ marginBottom: "20px", color: "#333" }}>
        🎤 Speech-to-Text Example
      </h2>

      {/* Status Section */}
      <div
        style={{
          background: "#f5f5f5",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <strong>State:</strong>{" "}
          <span
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              background: getStateColor(),
              color: "white",
              fontSize: "12px",
            }}
          >
            {state}
          </span>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <strong>Available:</strong>{" "}
          {available === null ? (
            "Checking..."
          ) : available ? (
            <span style={{ color: "#4caf50" }}>✅ Yes</span>
          ) : (
            <span style={{ color: "#f44336" }}>❌ No</span>
          )}
        </div>

        <div style={{ marginBottom: "10px" }}>
          <strong>Permission:</strong>{" "}
          <span
            style={{
              color:
                permission === "granted"
                  ? "#4caf50"
                  : permission === "denied"
                  ? "#f44336"
                  : "#ff9800",
            }}
          >
            {permission}
          </span>
        </div>

        {supportedLanguages.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <strong>Supported Languages:</strong>{" "}
            {supportedLanguages.join(", ")}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "10px",
              background: "#ffebee",
              color: "#c62828",
              borderRadius: "4px",
              marginTop: "10px",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Language Selection */}
      {supportedLanguages.length > 0 && (
        <div
          style={{
            background: "#e3f2fd",
            padding: "15px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <label style={{ display: "block", marginBottom: "10px" }}>
            <strong>Language:</strong>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{
                marginLeft: "10px",
                padding: "5px 10px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              {supportedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Transcript Display */}
      <div
        style={{
          background: "#fff3e0",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
          minHeight: "100px",
        }}
      >
        <strong>Transcript:</strong>
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            background: "white",
            borderRadius: "4px",
            minHeight: "50px",
            fontSize: "16px",
            lineHeight: "1.5",
          }}
        >
          {partialTranscript && (
            <div style={{ color: "#666", fontStyle: "italic" }}>
              {partialTranscript}...
            </div>
          )}
          {transcript && (
            <div
              style={{
                color: "#333",
                marginTop: partialTranscript ? "10px" : "0",
              }}
            >
              {transcript}
            </div>
          )}
          {!partialTranscript && !transcript && (
            <div style={{ color: "#999" }}>No transcript yet...</div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {permission !== "granted" && (
          <button
            onClick={handleRequestPermission}
            style={{
              padding: "10px 20px",
              background: "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Request Permission
          </button>
        )}

        <button
          onClick={handleStartListening}
          disabled={!available || permission !== "granted" || isListening}
          style={{
            padding: "10px 20px",
            background:
              !available || permission !== "granted" || isListening
                ? "#ccc"
                : "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              !available || permission !== "granted" || isListening
                ? "not-allowed"
                : "pointer",
            fontSize: "14px",
          }}
        >
          {isListening ? "🎤 Listening..." : "🎤 Start Listening"}
        </button>
      </div>
    </div>
  );
}
