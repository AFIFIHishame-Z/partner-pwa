import { useState, useRef, useEffect } from "react";
import { iframeCommunication } from "../services/IframeCommunication";
import type { VoiceResponse } from "../services/IframeCommunication";

const FrenchVoiceExercise = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleStartRecording = async () => {
    setIsVoiceLoading(true);
    setVoiceError(null);
    setRecordingDuration(0);

    try {
      console.log("Requesting voice recording from parent app...");

      const response: VoiceResponse =
        await iframeCommunication.requestVoiceRecord({
          maxDuration: 60,
          audioFormat: "webm",
          quality: "medium",
        });

      if (response.success && response.data) {
        console.log("Voice recording started successfully:", response);
        setIsRecording(true);
        startRecordingTimer();
      } else {
        throw new Error(response.error || "Voice recording failed to start");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setVoiceError(errorMessage);
      console.error("Voice recording error:", err);
    } finally {
      setIsVoiceLoading(false);
    }
  };

  const handleStopRecording = async () => {
    if (!isRecording) return;

    console.log("🎤 Stopping voice recording...");
    setIsVoiceLoading(true);
    setVoiceError(null);

    try {
      // Send stop recording request to parent
      console.log("🎤 Sending stop recording request to parent");
      iframeCommunication.sendMessageToParent({
        type: "VOICE_REQUEST",
        action: "stop_recording",
        requestId: `voice_stop_${Date.now()}`,
      });

      // Stop the recording timer
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      setIsRecording(false);
      console.log("🎤 Voice recording stopped locally");

      // Wait for parent app to send the actual audio data
      console.log("🎤 Waiting for parent app to send audio data...");

      // Fallback: If no response from parent after 5 seconds, show error
      timeoutRef.current = window.setTimeout(() => {
        if (!recordedAudio) {
          console.log("🎤 No audio data received from parent after 5 seconds");
          setVoiceError("No audio data received from parent app");
          setIsVoiceLoading(false);
        }
      }, 5000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to stop recording";
      setVoiceError(errorMessage);
      console.error("🎤 Stop recording error:", err);
    } finally {
      // Don't set loading to false here, let the fallback or completion handler do it
    }
  };

  const startRecordingTimer = () => {
    recordingIntervalRef.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);
  };

  const handlePlayRecording = async () => {
    if (audioRef.current && recordedAudio) {
      try {
        console.log("🎤 Attempting to play audio...");
        console.log("🎤 Audio element:", audioRef.current);
        console.log("🎤 Audio src:", audioRef.current.src);
        console.log("🎤 Audio readyState:", audioRef.current.readyState);
        console.log("🎤 Audio paused:", audioRef.current.paused);

        // Check if audio is already playing
        if (!audioRef.current.paused) {
          console.log("🎤 Audio is already playing, pausing first");
          audioRef.current.pause();
          return;
        }

        // Wait for audio to be ready
        if (audioRef.current.readyState < 2) {
          console.log("🎤 Audio not ready, waiting...");
          await new Promise((resolve) => {
            const timeout = setTimeout(() => {
              console.log("🎤 Audio load timeout");
              resolve(undefined);
            }, 3000);

            audioRef.current!.addEventListener(
              "canplay",
              () => {
                clearTimeout(timeout);
                resolve(undefined);
              },
              { once: true }
            );
          });
        }

        // Try to play the audio
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        console.log("🎤 Audio playback started successfully");
      } catch (error) {
        console.error("🎤 Audio playback error:", error);
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            console.log("🎤 Playback was aborted (this is normal)");
          } else if (error.name === "NotAllowedError") {
            console.log("🎤 Playback not allowed (user interaction required)");
          } else {
            console.error("🎤 Other playback error:", error.message);
          }
        }
      }
    } else {
      console.log(
        "🎤 Cannot play: audio element or recordedAudio not available"
      );
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle voice recording completion
  useEffect(() => {
    const handleVoiceRecordingComplete = (response: VoiceResponse) => {
      console.log("🎤 Voice recording completed:", response);
      console.log("🎤 Response success:", response.success);
      console.log("🎤 Response data:", response.data);

      if (response.success && response.data) {
        // Handle different audio data formats from parent app
        const audioData = response.data.audioUrl || response.data.audioBlob;
        console.log("🎤 Audio data from parent:", audioData);
        console.log("🎤 Audio data type:", typeof audioData);

        if (audioData) {
          // Clear the timeout since we received audio data
          if (timeoutRef.current) {
            console.log("🎤 Clearing timeout - audio data received");
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }

          if (typeof audioData === "string") {
            console.log(
              "🎤 Setting recorded audio from parent string:",
              audioData.substring(0, 50) + "..."
            );
            setRecordedAudio(audioData);
            console.log("🎤 Audio URL set successfully from parent");
          } else if (audioData instanceof Blob) {
            const audioUrl = URL.createObjectURL(audioData);
            console.log(
              "🎤 Setting recorded audio from parent blob:",
              audioUrl
            );
            setRecordedAudio(audioUrl);
            console.log("🎤 Audio blob converted to URL successfully");
          }
          console.log(
            "🎤 Voice recording data received successfully from parent"
          );
        } else {
          console.error("🎤 No audio data received from parent");
          setVoiceError("No audio data received from parent app");
        }
      } else {
        console.error("🎤 Voice recording failed from parent:", response.error);
        setVoiceError(response.error || "Voice recording failed");
      }

      setIsRecording(false);
      setIsVoiceLoading(false);
      console.log("🎤 Recording state reset after parent response");
    };

    console.log("🎤 Setting up voice recording complete handler");
    iframeCommunication.onVoiceRecordingComplete(handleVoiceRecordingComplete);

    return () => {
      console.log("🎤 Cleaning up voice recording handler");
      iframeCommunication.removeVoiceRecordingHandler();
      // Clear timeout on cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const handleRetakeRecording = () => {
    setRecordedAudio(null);
    setError(null);
    setVoiceError(null);
    setRecordingDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
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
      {(error || voiceError) && (
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
            <strong>Erreur:</strong> {error || voiceError}
          </div>
        </div>
      )}

      {/* Voice Recording Controls */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            disabled={isVoiceLoading}
            style={{
              background: isVoiceLoading
                ? "linear-gradient(135deg, #ccc 0%, #999 100%)"
                : "linear-gradient(135deg, #ffc107 0%, #e0a800 100%)",
              color: isVoiceLoading ? "#666" : "#212529",
              border: "none",
              padding: "16px 32px",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: "600",
              cursor: isVoiceLoading ? "not-allowed" : "pointer",
              minWidth: "200px",
              boxShadow: isVoiceLoading
                ? "none"
                : "0 4px 15px rgba(255, 193, 7, 0.3)",
              transition: "all 0.3s ease",
            }}
          >
            {isVoiceLoading
              ? "⏳ Démarrage..."
              : "🎤 Commencer l'Enregistrement"}
          </button>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
            }}
          >
            {/* Recording indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                padding: "15px 25px",
                background: "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
                color: "white",
                borderRadius: "30px",
                animation: "pulse 1.5s infinite",
                boxShadow: "0 4px 15px rgba(220, 53, 69, 0.4)",
              }}
            >
              <div
                style={{
                  width: "15px",
                  height: "15px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  animation: "blink 1s infinite",
                }}
              ></div>
              <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                ENREGISTREMENT EN COURS
              </span>
              <span style={{ fontSize: "20px", fontWeight: "bold" }}>
                {formatDuration(recordingDuration)}
              </span>
            </div>

            <button
              onClick={handleStopRecording}
              disabled={isVoiceLoading}
              style={{
                background: isVoiceLoading
                  ? "linear-gradient(135deg, #ccc 0%, #999 100%)"
                  : "linear-gradient(135deg, #dc3545 0%, #c82333 100%)",
                color: "white",
                border: "none",
                padding: "16px 32px",
                borderRadius: "12px",
                fontSize: "18px",
                fontWeight: "600",
                cursor: isVoiceLoading ? "not-allowed" : "pointer",
                minWidth: "200px",
                boxShadow: isVoiceLoading
                  ? "none"
                  : "0 4px 15px rgba(220, 53, 69, 0.3)",
                transition: "all 0.3s ease",
              }}
            >
              {isVoiceLoading ? "⏳ Arrêt..." : "⏹️ Arrêter l'Enregistrement"}
            </button>
          </div>
        )}
      </div>

      {/* Additional controls when audio is recorded */}
      {recordedAudio && !isRecording && (
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
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
              disabled={isVoiceLoading}
              style={{
                background: isVoiceLoading
                  ? "linear-gradient(135deg, #ccc 0%, #999 100%)"
                  : "linear-gradient(135deg, #ffc107 0%, #e0a800 100%)",
                color: isVoiceLoading ? "#666" : "#212529",
                border: "none",
                padding: "16px 32px",
                borderRadius: "12px",
                fontSize: "18px",
                fontWeight: "600",
                cursor: isVoiceLoading ? "not-allowed" : "pointer",
                boxShadow: isVoiceLoading
                  ? "none"
                  : "0 4px 15px rgba(255, 193, 7, 0.3)",
                transition: "all 0.3s ease",
              }}
            >
              {isVoiceLoading ? "⏳ Démarrage..." : "🎤 Nouvel Enregistrement"}
            </button>
            <button
              onClick={handleRetakeRecording}
              style={{
                background: "linear-gradient(135deg, #6c757d 0%, #5a6268 100%)",
                color: "white",
                border: "none",
                padding: "16px 32px",
                borderRadius: "12px",
                fontSize: "18px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(108, 117, 125, 0.3)",
                transition: "all 0.3s ease",
              }}
            >
              🗑️ Effacer
            </button>
          </div>
        </div>
      )}

      {/* Recorded Audio */}
      {recordedAudio && (
        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
            backgroundColor: "#e8f5e8",
            padding: "20px",
            borderRadius: "10px",
            border: "2px solid #28a745",
          }}
        >
          <p
            style={{
              color: "#28a745",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            ✅ AUDIO SECTION IS VISIBLE - recordedAudio exists!
          </p>
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
              minWidth: "400px",
              minHeight: "80px",
            }}
          >
            <p
              style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}
            >
              Debug: Audio URL length: {recordedAudio.length}
            </p>
            <audio
              ref={audioRef}
              controls
              preload="metadata"
              style={{
                width: "100%",
                maxWidth: "400px",
                height: "40px",
                display: "block",
                margin: "0 auto",
              }}
              onError={(e) => {
                console.error("🎤 Audio element error:", e);
              }}
              onLoadStart={() => {
                console.log("🎤 Audio load started");
              }}
              onCanPlay={() => {
                console.log("🎤 Audio can play");
              }}
              onPlay={() => {
                console.log("🎤 Audio playback started");
              }}
              onPause={() => {
                console.log("🎤 Audio playback paused");
              }}
              onEnded={() => {
                console.log("🎤 Audio playback ended");
              }}
            >
              <source src={recordedAudio} type="audio/webm" />
              <source src={recordedAudio} type="audio/wav" />
              Votre navigateur ne supporte pas l'élément audio.
            </audio>
            <div style={{ marginTop: "10px" }}>
              <button
                onClick={handlePlayRecording}
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: "pointer",
                  marginRight: "10px",
                }}
              >
                ▶️ Play
              </button>
              <button
                onClick={() => {
                  console.log("🎤 Debug: Audio element:", audioRef.current);
                  console.log("🎤 Debug: Audio src:", audioRef.current?.src);
                  console.log(
                    "🎤 Debug: Audio readyState:",
                    audioRef.current?.readyState
                  );
                }}
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                🔍 Debug Audio
              </button>
            </div>
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

      {/* Add CSS animations */}
      <style>
        {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

export default FrenchVoiceExercise;
