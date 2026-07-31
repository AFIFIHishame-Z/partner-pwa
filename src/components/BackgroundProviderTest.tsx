import { useState, useCallback } from "react";
import { BackgroundProviderClient } from "@superapp_men/content-provider";
import type { BackgroundName } from "@superapp_men/content-provider";

const BACKGROUNDS: BackgroundName[] = [
  "arbre", "champs", "decor_souk", "douar", "embarcadere", "msid", "oliveraie", "puis",
];

type BgEntry = {
  name: BackgroundName;
  url: string;
};

export function BackgroundProviderTest() {
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [loaded, setLoaded]         = useState<BgEntry[]>([]);
  const [selected, setSelected]     = useState<BackgroundName | null>(null);

  const handleLoadOne = useCallback(async (name: BackgroundName) => {
    setError(null);
    setIsLoading(true);
    const client = new BackgroundProviderClient({ debug: true });
    try {
      const { url } = await client.getBackground(name);
      setLoaded((prev) => {
        const exists = prev.find((e) => e.name === name);
        if (exists) return prev.map((e) => e.name === name ? { name, url } : e);
        return [...prev, { name, url }];
      });
      setSelected(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      client.destroy();
      setIsLoading(false);
    }
  }, []);

  const handleLoadAll = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    const client = new BackgroundProviderClient({ debug: true });
    try {
      const entries = await Promise.all(
        BACKGROUNDS.map(async (name) => {
          const { url } = await client.getBackground(name);
          return { name, url } as BgEntry;
        }),
      );
      setLoaded(entries);
      setSelected(entries[0].name);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      client.destroy();
      setIsLoading(false);
    }
  }, []);

  const selectedEntry = loaded.find((e) => e.name === selected);

  return (
    <div style={card}>
      <h2 style={{ marginTop: 0, color: "#1d3557" }}>BackgroundProviderClient — getBackground()</h2>
      <p style={{ color: "#4f5d75", fontSize: 14, marginTop: 0 }}>
        Loads shared WebP background images from the SuperApp static assets via postMessage.
        The returned <code>url</code> is a base64 data URL usable as <code>img.src</code> or CSS
        <code>background-image</code>.
      </p>

      {/* Buttons: one per background + load all */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {BACKGROUNDS.map((name) => {
          const alreadyLoaded = loaded.some((e) => e.name === name);
          return (
            <button
              key={name}
              type="button"
              disabled={isLoading}
              onClick={() => void handleLoadOne(name)}
              style={{
                ...btn(alreadyLoaded ? "#16a34a" : "#2563eb", isLoading),
                outline: selected === name ? "3px solid #fbbf24" : undefined,
              }}
            >
              {name}
            </button>
          );
        })}
        <button
          type="button"
          disabled={isLoading}
          onClick={() => void handleLoadAll()}
          style={btn("#7c3aed", isLoading)}
        >
          {isLoading ? "Loading…" : "Load all"}
        </button>
      </div>

      {error && <div style={errorBox}><strong>Error:</strong> {error}</div>}

      {/* Thumbnail strip */}
      {loaded.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {loaded.map((e) => (
            <button
              key={e.name}
              type="button"
              onClick={() => setSelected(e.name)}
              style={{
                border: selected === e.name ? "3px solid #2563eb" : "2px solid #cbd5e1",
                borderRadius: 8, padding: 4, background: "none", cursor: "pointer",
              }}
            >
              <img
                src={e.url}
                alt={e.name}
                style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 6, display: "block" }}
              />
              <span style={{ fontSize: 11, color: "#475569", display: "block", textAlign: "center", marginTop: 2 }}>
                {e.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Full-size preview with CSS background-image usage demo */}
      {selectedEntry && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ margin: 0, fontWeight: 600, color: "#1d3557", fontSize: 14 }}>
            Preview — <code>{selectedEntry.name}</code>
          </p>

          {/* As <img> */}
          <div>
            <span style={{ fontSize: 12, color: "#64748b" }}>As &lt;img&gt; src:</span>
            <img
              src={selectedEntry.url}
              alt={selectedEntry.name}
              style={{ display: "block", width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, marginTop: 4 }}
            />
          </div>

          {/* As CSS background */}
          <div>
            <span style={{ fontSize: 12, color: "#64748b" }}>As CSS background-image:</span>
            <div
              style={{
                marginTop: 4,
                height: 120,
                borderRadius: 8,
                backgroundImage: `url(${selectedEntry.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ background: "rgba(0,0,0,0.45)", color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 13 }}>
                {selectedEntry.name}
              </span>
            </div>
          </div>

          <details>
            <summary style={{ cursor: "pointer", fontSize: 13, color: "#64748b" }}>
              Data URL (first 200 chars)
            </summary>
            <pre style={{ fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-all", marginTop: 6, color: "#475569" }}>
              {selectedEntry.url.slice(0, 200)}…
            </pre>
          </details>
        </div>
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
    cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14,
  };
}
