import { useState, useCallback, useRef } from "react";
import { MediaProviderClient } from "@superapp_men/content-provider";

const EXAMPLE_PATHS = [
  "consignes/00e5b2a4-98c8-409e-9b68-d8eb397d4c78.mp3",
  "questions/159903a1-803d-46ee-9f34-365010d378f3.mp3",
];

function isImage(path: string) {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(path);
}

function isAudio(path: string) {
  return /\.(mp3|m4a|ogg|wav)$/i.test(path);
}

function isVideo(path: string) {
  return /\.(mp4|webm)$/i.test(path);
}

export function MediaProviderTest() {
  const [partnerCode, setPartnerCode] = useState("poc");
  const [mediaPath, setMediaPath]     = useState(EXAMPLE_PATHS[0]);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [objectUrl, setObjectUrl]     = useState<string | null>(null);
  const [mimeType, setMimeType]       = useState<string>("");
  const revokeRef = useRef<(() => void) | null>(null);

  const clearPrev = () => {
    if (revokeRef.current) {
      revokeRef.current();
      revokeRef.current = null;
    }
    setObjectUrl(null);
    setMimeType("");
    setError(null);
  };

  const handleLoad = useCallback(async () => {
    clearPrev();
    setIsLoading(true);
    const client = new MediaProviderClient({ partnerCode, timeout: 30000, debug: true });
    try {
      const { url, mimeType: mime, revoke } = await client.getMediaObjectUrl(mediaPath);
      revokeRef.current = revoke;
      setObjectUrl(url);
      setMimeType(mime);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      client.destroy();
      setIsLoading(false);
    }
  }, [partnerCode, mediaPath]);

  return (
    <div style={card}>
      <h2 style={{ marginTop: 0, color: "#1d3557" }}>MediaProviderClient — getMediaObjectUrl()</h2>
      <p style={{ color: "#4f5d75", fontSize: 14, marginTop: 0 }}>
        Loads a downloaded media file (audio / image / video) from the SuperApp and plays / displays it.
      </p>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <label style={labelStyle}>
          Partner code
          <input value={partnerCode} onChange={(e) => setPartnerCode(e.target.value)} style={inputStyle} />
        </label>

        <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
          Media path (relative, e.g. <code>consignes/file.mp3</code>)
          <input
            value={mediaPath}
            onChange={(e) => setMediaPath(e.target.value)}
            style={inputStyle}
            placeholder="consignes/file.mp3"
          />
        </label>
      </div>

      {/* Quick-pick examples */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <span style={{ fontSize: 13, color: "#64748b", alignSelf: "center" }}>Examples:</span>
        {EXAMPLE_PATHS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setMediaPath(p)}
            style={{ ...btn("#64748b", false), fontSize: 12, padding: "4px 10px" }}
          >
            {p.split("/").pop()}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void handleLoad()}
        disabled={isLoading}
        style={btn("#2563eb", isLoading)}
      >
        {isLoading ? "Loading…" : "Load media"}
      </button>

      {error && <div style={errorBox}><strong>Error:</strong> {error}</div>}

      {objectUrl && (
        <div style={{ ...resultBox, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            MIME: <code>{mimeType}</code>
          </div>

          {isAudio(mediaPath) && (
            <>
              <p style={{ margin: 0, fontWeight: 600, color: "#1d3557" }}>Audio player:</p>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <audio controls src={objectUrl} style={{ width: "100%" }} />
            </>
          )}

          {isVideo(mediaPath) && (
            <>
              <p style={{ margin: 0, fontWeight: 600, color: "#1d3557" }}>Video player:</p>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video controls src={objectUrl} style={{ maxWidth: "100%", borderRadius: 8 }} />
            </>
          )}

          {isImage(mediaPath) && (
            <>
              <p style={{ margin: 0, fontWeight: 600, color: "#1d3557" }}>Image:</p>
              <img src={objectUrl} alt="loaded media" style={{ maxWidth: "100%", borderRadius: 8 }} />
            </>
          )}

          {!isAudio(mediaPath) && !isVideo(mediaPath) && !isImage(mediaPath) && (
            <a href={objectUrl} download style={{ color: "#2563eb" }}>Download file</a>
          )}
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
const labelStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 6, fontSize: 14,
};
const inputStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1", borderRadius: 6,
  padding: "8px 10px", fontSize: 14, boxSizing: "border-box", width: "100%",
};
const errorBox: React.CSSProperties = {
  padding: 10, borderRadius: 6, background: "#fee2e2",
  color: "#991b1b", border: "1px solid #fecaca", fontSize: 14,
};
const resultBox: React.CSSProperties = {
  padding: 10, borderRadius: 6, background: "#f0fdf4", border: "1px solid #bbf7d0",
};
function btn(color: string, disabled: boolean): React.CSSProperties {
  return {
    padding: "8px 16px", border: "none", borderRadius: 6,
    background: disabled ? "#94a3b8" : color, color: "#fff",
    cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14,
    alignSelf: "flex-start",
  };
}
