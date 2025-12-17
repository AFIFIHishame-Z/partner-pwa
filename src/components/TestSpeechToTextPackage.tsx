import { useState, useEffect } from "react";
import {
  SpeechToText,
  RecognitionState,
  Language,
} from "@superapp_men/speech-to-text";

export function TestSpeechToTextPackage() {
  const [speech] = useState(
    () =>
      new SpeechToText({
        timeout: 10000,
        debug: true,
      })
  );

  const [state, setState] = useState<RecognitionState>(RecognitionState.IDLE);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // State changes
    const unsubState = speech.on("stateChange", ({ state }: any) => {
      setState(state);
      setIsListening(state === RecognitionState.LISTENING);
    });

    // Real-time partial results (if partialResults: true)
    const unsubPartial = speech.on("partialResult", ({ result }: any) => {
      setPartialTranscript(result.transcript);
    });

    // Final result with confidence
    const unsubResult = speech.on("result", ({ result }: any) => {
      setTranscript(result.transcript);
      setPartialTranscript(""); // Clear partial when final arrives
    });

    // Error handling
    const unsubError = speech.on("error", ({ message }: any) => {
      setError(message);
    });

    // Listening events
    const unsubStarted = speech.on("listeningStarted", () => {
      console.log("🎤 Listening started");
    });

    const unsubStopped = speech.on("listeningStopped", ({ duration }: any) => {
      console.log("⏹️ Listening stopped, duration:", duration);
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

  const handleStartListening = async () => {
    try {
      setError(null);
      setTranscript("");
      setPartialTranscript("");

      const permission = await speech.requestPermission();
      if (permission !== "granted") {
        setError("Microphone permission is required");
        return;
      }

      await speech.startListening({
        language: Language.AR_SA,
        partialResults: true, // Enable real-time updates
        popup: false, // Partner app manages UI
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start listening"
      );
    }
  };

  return (
    <div>
      <button onClick={handleStartListening} disabled={isListening}>
        {isListening ? "🎤 Listening..." : "🎤 Start Listening"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {partialTranscript && (
        <p style={{ fontStyle: "italic" }}>{partialTranscript}...</p>
      )}
      {transcript && <p>{transcript}</p>}
      <p>{JSON.stringify(state)}</p>
    </div>
  );
}
