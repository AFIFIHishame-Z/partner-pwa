import { useCallback, useRef, useState } from "react";
import { SoundProviderClient } from "@superapp_men/content-provider";
import type { SoundName } from "@superapp_men/content-provider";

const SOUNDS: SoundName[] = [
  "Loader marche compagnon",
  "cloudInOut",
  "deroulement panneau",
  "drag",
  "drop",
  "feedback KO-002",
  "feedback OK-001",
  "feedback OK-002",
  "feedback OK-003",
  "music_01",
  "music_02",
  "music_02_variation1-001",
  "music_02_variation1-002",
  "scroll menu ile-001",
  "son appuie bouton-001",
  "son bounce bouton-001",
  "son burn plein ecran",
  "son d'apparition consigne-001",
  "son fermeture panneau exercice",
  "son ouverture panneau exercice",
  "son progression bar-001",
  "son selection champ-001",
  "son selection element parmi autre-001",
  "sons etoiles-002",
  "splash screen",
];

// A name that is deliberately NOT in the shared_sound_design catalog — lets
// the PoC demonstrate the "sound not found" error path on demand.
const UNKNOWN_SOUND = "this-sound-does-not-exist" as SoundName;

export function SoundProviderTest() {
  const [loadingName, setLoadingName] = useState<SoundName | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastPlayed, setLastPlayed] = useState<SoundName | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback(async (name: SoundName) => {
    setError(null);
    setLoadingName(name);
    const client = new SoundProviderClient({ debug: true });
    try {
      const { url } = await client.getSound(name);

      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      await audio.play();

      setLastPlayed(name);
    } catch (e) {
      // Clear error behavior: unknown/failed sounds never throw uncaught —
      // the message is surfaced here for the partner app to display.
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      client.destroy();
      setLoadingName(null);
    }
  }, []);

  return (
    <div style={card}>
      <h2 style={{ marginTop: 0, color: "#1d3557" }}>SoundProviderClient — getSound()</h2>
      <p style={{ color: "#4f5d75", fontSize: 14, marginTop: 0 }}>
        Loads shared sound-design WAV files from the SuperApp static assets via postMessage.
        The returned <code>url</code> is a base64 data URL usable directly with{" "}
        <code>new Audio(url)</code>.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {SOUNDS.map((name) => (
          <button
            key={name}
            type="button"
            disabled={loadingName !== null}
            onClick={() => void playSound(name)}
            style={{
              ...btn(lastPlayed === name ? "#16a34a" : "#2563eb", loadingName !== null),
              outline: loadingName === name ? "3px solid #fbbf24" : undefined,
            }}
          >
            {loadingName === name ? "…" : "▶"} {name}
          </button>
        ))}
        <button
          type="button"
          disabled={loadingName !== null}
          onClick={() => void playSound(UNKNOWN_SOUND)}
          style={btn("#dc2626", loadingName !== null)}
          title="Requests a sound name that does not exist, to demonstrate the error path"
        >
          ⚠ Request unknown sound
        </button>
      </div>

      {error && (
        <div style={errorBox}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {lastPlayed && !error && (
        <p style={{ margin: 0, fontSize: 13, color: "#16a34a", fontWeight: 600 }}>
          Now playing: <code>{lastPlayed}</code>
        </p>
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  padding: "20px", maxWidth: 800, margin: "20px auto",
  border: "1px solid #dbe3ec", borderRadius: 10,
  background: "#f8fbff", fontFamily: "system-ui, sans-serif",
  display: "flex", flexDirection: "column", gap: 12,
};
const errorBox: React.CSSProperties = {
  padding: 10, borderRadius: 6, background: "#fee2e2",
  color: "#991b1b", border: "1px solid #fecaca", fontSize: 14,
};
function btn(color: string, disabled: boolean): React.CSSProperties {
  return {
    padding: "8px 16px", border: "none", borderRadius: 6,
    background: disabled ? "#94a3b8" : color, color: "#fff",
    cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13,
  };
}
