import { useState, useEffect } from "react";
import {
  TextToSpeech,
  SpeechState,
  Language,
} from "@superapp_men/text-to-speech";

export function TextToSpeechExample() {
  const [tts] = useState(
    () =>
      new TextToSpeech({
        timeout: 10000,
        debug: true,
      }),
  );

  const [state, setState] = useState<SpeechState>(SpeechState.IDLE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    Language.FR_FR,
  );
  const [text, setText] = useState("");
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [lastDuration, setLastDuration] = useState<number | null>(null);

  useEffect(() => {
    const unsubState = tts.on("stateChange", ({ state }: any) => {
      console.log("[superapp] [TTS-React] stateChange:", state);
      setState(state);
      setIsSpeaking(
        state === SpeechState.SPEAKING || state === SpeechState.PAUSED,
      );
    });

    const unsubStarted = tts.on("speakStarted", ({ sessionId }: any) => {
      console.log("[superapp] [TTS-React] speakStarted:", sessionId);
    });

    const unsubFinished = tts.on("speakFinished", ({ duration }: any) => {
      console.log("[superapp] [TTS-React] speakFinished, duration:", duration);
      setLastDuration(duration);
    });

    const unsubError = tts.on("error", ({ message }: any) => {
      console.log("[superapp] [TTS-React] error:", message);
      setError(message);
    });

    return () => {
      unsubState();
      unsubStarted();
      unsubFinished();
      unsubError();
      tts.destroy();
    };
  }, [tts]);

  // Check availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const isAvailable = await tts.isAvailable();
        setAvailable(isAvailable);

        if (isAvailable) {
          const languages = await tts.getSupportedLanguages();
          setSupportedLanguages(languages);
        }
      } catch (err) {
        console.error("Error checking TTS availability:", err);
        setAvailable(false);
      }
    };

    checkAvailability();
  }, [tts]);

  const handleSpeak = async () => {
    if (!text.trim()) {
      setError("Veuillez saisir du texte");
      return;
    }

    try {
      setError(null);
      setLastDuration(null);

      await tts.speak({
        text,
        language: selectedLanguage,
        rate,
        pitch,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Échec de la synthèse vocale",
      );
    }
  };

  const handleStop = async () => {
    try {
      setError(null);
      await tts.stop();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'arrêt");
    }
  };

  const handlePause = async () => {
    try {
      await tts.pause();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la pause");
    }
  };

  const handleResume = async () => {
    try {
      await tts.resume();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la reprise");
    }
  };

  const handleQuickSpeak = async (sampleText: string, lang: string) => {
    try {
      setError(null);
      setLastDuration(null);
      setText(sampleText);
      setSelectedLanguage(lang);

      await tts.speak({
        text: sampleText,
        language: lang,
        rate,
        pitch,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Échec de la synthèse vocale",
      );
    }
  };

  const getStateColor = () => {
    switch (state) {
      case SpeechState.SPEAKING:
        return "#4caf50";
      case SpeechState.PAUSED:
        return "#ff9800";
      case SpeechState.ERROR:
        return "#f44336";
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
        marginTop: "30px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2 style={{ marginBottom: "20px", color: "#333" }}>
        Synthèse vocale (Text-to-Speech)
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
          <strong>État :</strong>{" "}
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
          <strong>Disponible :</strong>{" "}
          {available === null ? (
            "Vérification..."
          ) : available ? (
            <span style={{ color: "#4caf50" }}>Oui</span>
          ) : (
            <span style={{ color: "#f44336" }}>Non</span>
          )}
        </div>

        {lastDuration !== null && (
          <div style={{ marginBottom: "10px" }}>
            <strong>Dernière durée :</strong> {(lastDuration / 1000).toFixed(1)}{" "}
            s
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
            <strong>Erreur :</strong> {error}
          </div>
        )}
      </div>

      {/* Quick Speak Buttons */}
      <div
        style={{
          background: "#e8f5e9",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <strong style={{ display: "block", marginBottom: "10px" }}>
          Exemples rapides :
        </strong>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => handleQuickSpeak("Bonjour, comment allez-vous ?", Language.FR_FR)}
            disabled={isSpeaking}
            style={{
              padding: "8px 14px",
              background: isSpeaking ? "#ccc" : "#1565c0",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isSpeaking ? "not-allowed" : "pointer",
              fontSize: "13px",
            }}
          >
            Français
          </button>
          
          
          <button
            onClick={() => handleQuickSpeak("مرحبا، كيف حالك؟", Language.AR_SA)}
            disabled={isSpeaking}
            style={{
              padding: "8px 14px",
              background: isSpeaking ? "#ccc" : "#6a1b9a",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isSpeaking ? "not-allowed" : "pointer",
              fontSize: "13px",
            }}
          >
            العربية
          </button>
        </div>
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
            <strong>Langue :</strong>
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

      {/* Text Input */}
      <div
        style={{
          background: "#fff3e0",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <strong style={{ display: "block", marginBottom: "10px" }}>
          Texte à prononcer :
        </strong>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Saisissez le texte à prononcer..."
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "16px",
            lineHeight: "1.5",
            fontFamily: "inherit",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />

        {/* Rate & Pitch Controls */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "12px",
            flexWrap: "wrap",
          }}
        >
          <label style={{ flex: 1, minWidth: "150px" }}>
            <strong>Vitesse :</strong> {rate.toFixed(1)}
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              style={{ width: "100%", marginTop: "4px" }}
            />
          </label>
          <label style={{ flex: 1, minWidth: "150px" }}>
            <strong>Tonalité :</strong> {pitch.toFixed(1)}
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              style={{ width: "100%", marginTop: "4px" }}
            />
          </label>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          onClick={handleSpeak}
          disabled={!available || isSpeaking || !text.trim()}
          style={{
            padding: "10px 20px",
            background:
              !available || isSpeaking || !text.trim() ? "#ccc" : "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              !available || isSpeaking || !text.trim()
                ? "not-allowed"
                : "pointer",
            fontSize: "14px",
          }}
        >
          Parler
        </button>

      

        <button
          onClick={handleStop}
          disabled={!isSpeaking}
          style={{
            padding: "10px 20px",
            background: !isSpeaking ? "#ccc" : "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: !isSpeaking ? "not-allowed" : "pointer",
            fontSize: "14px",
          }}
        >
          Arrêter
        </button>
      </div>
    </div>
  );
}
