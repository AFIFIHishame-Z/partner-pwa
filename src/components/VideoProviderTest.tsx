import { useState, useCallback } from "react";

/**
 * VideoProviderTest — tests the SuperApp offline video flow via raw postMessage
 * (protocol: "video:request" / "video:download").
 *
 * Uses the raw protocol instead of VideoProviderClient so it works with any
 * installed @superapp_men/content-provider version. Once v1.6.0+ is
 * installed, this can be swapped for `new VideoProviderClient({ partnerCode })`.
 *
 * Both messages now BLOCK until the outcome is final — the SuperApp waits
 * for the download to finish (or fail) before responding, so no polling is
 * needed here:
 *  1. Video downloaded            → { available: true, localUri } → plays inline
 *  2. Missing + internet          → SuperApp downloads it, THEN responds with
 *                                    the same { available: true, localUri }
 *  3. Missing + offline           → { error: "VIDEO_NOT_DOWNLOADED_AND_OFFLINE" }
 *  4. Unknown video               → { error: "VIDEO_NOT_IN_MANIFEST" }
 *  5. Download itself failed      → { error: "DOWNLOAD_FAILED" } (or a more specific code)
 *  6. Explicit download request   → "video:download" message (same semantics)
 */

interface VideoStatusBody {
  available: boolean;
  downloaded: boolean;
  downloading: boolean;
  hasInternet: boolean;
  localUri: string | null;
  error: string | null;
}

const EXAMPLE_PATHS = [
  "palier1/v1p1.mp4",
  "palier2/v1p2.mp4",
  "palier3/v1p3.mp4",
  "v2p1.mp4",            // name-only lookup (resolved across paliers)
  "palier9/unknown.mp4", // not in manifest → VIDEO_NOT_IN_MANIFEST
];

// Must comfortably exceed a full video download on a slow connection —
// this is no longer a quick status-check round trip.
const REQUEST_TIMEOUT_MS = 120000;

function sendVideoMessage(
  type: "video:request" | "video:download",
  partnerCode: string,
  videoPath: string,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<{ statusCode: number; body: VideoStatusBody }> {
  const responseType = type === "video:request" ? "video:response" : "video:download-response";
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error(`Video request timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      const msg = event.data;
      if (!msg || msg.type !== responseType || msg.requestId !== requestId) return;
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve({ statusCode: msg.statusCode, body: msg.body as VideoStatusBody });
    }

    window.addEventListener("message", onMessage);
    window.parent.postMessage(
      { type, requestId, payload: { partnerCode, videoPath }, timestamp: Date.now() },
      "*",
    );
  });
}

export function VideoProviderTest() {
  const [partnerCode, setPartnerCode] = useState("bewize");
  const [videoPath, setVideoPath]     = useState(EXAMPLE_PATHS[0]);
  const [isLoading, setIsLoading]     = useState(false);
  const [status, setStatus]           = useState<VideoStatusBody | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const doRequest = useCallback(async (type: "video:request" | "video:download") => {
    setIsLoading(true);
    setError(null);
    try {
      // This awaits the full download when the video is missing — the
      // "Loading…" state below can stay up for as long as the download takes.
      const { body } = await sendVideoMessage(type, partnerCode, videoPath);
      setStatus(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [partnerCode, videoPath]);

  const statusColor = (b: VideoStatusBody) =>
    b.available ? "#16a34a" : "#dc2626";

  return (
    <div style={card}>
      <h2 style={{ marginTop: 0, color: "#1d3557" }}>VideoProvider — video:request / video:download</h2>
      <p style={{ color: "#4f5d75", fontSize: 14, marginTop: 0 }}>
        Asks the SuperApp for a palier video. This call BLOCKS until the outcome is final:
        already downloaded → plays locally right away. Missing + online → the SuperApp
        downloads it, then the button just keeps showing "Loading…" until it resolves with the
        video. Missing + offline → <code>VIDEO_NOT_DOWNLOADED_AND_OFFLINE</code> immediately, no wait.
      </p>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <label style={labelStyle}>
          Partner code
          <input value={partnerCode} onChange={(e) => setPartnerCode(e.target.value)} style={inputStyle} />
        </label>

        <label style={{ ...labelStyle, gridColumn: "1 / -1" }}>
          Video path (e.g. <code>palier3/v1p3.mp4</code> or just <code>v1p3.mp4</code>)
          <input
            value={videoPath}
            onChange={(e) => setVideoPath(e.target.value)}
            style={inputStyle}
            placeholder="palier3/v1p3.mp4"
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
            onClick={() => setVideoPath(p)}
            style={{ ...btn("#64748b", false), fontSize: 12, padding: "4px 10px" }}
          >
            {p}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => void doRequest("video:request")}
          disabled={isLoading}
          style={btn("#2563eb", isLoading)}
        >
          {isLoading ? "Loading…" : "Get video (video:request)"}
        </button>
        <button
          type="button"
          onClick={() => void doRequest("video:download")}
          disabled={isLoading}
          style={btn("#7c3aed", isLoading)}
        >
          Download video (video:download)
        </button>
      </div>

      {error && <div style={errorBox}><strong>Transport error:</strong> {error}</div>}

      {status && (
        <div style={{ ...resultBox, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontWeight: 700, color: statusColor(status) }}>
            {status.available ? "✓ Available (downloaded)"
              : status.error === "VIDEO_NOT_DOWNLOADED_AND_OFFLINE" ? "✗ Not downloaded + OFFLINE"
              : status.error === "VIDEO_NOT_IN_MANIFEST" ? "✗ Not in manifest"
              : status.error ? `✗ Download failed (${status.error})`
              : "✗ Unavailable"}
          </div>

          {/* Full status object — the contract partners consume */}
          <pre style={{
            margin: 0, fontSize: 12, background: "#0f172a", color: "#e2e8f0",
            padding: 10, borderRadius: 6, overflowX: "auto",
          }}>
            {JSON.stringify(status, null, 2)}
          </pre>

          <div style={{ fontSize: 13, color: "#64748b" }}>
            downloaded: <b>{String(status.downloaded)}</b> · hasInternet: <b>{String(status.hasInternet)}</b>
            {" "}(two separate facts — never merged)
          </div>

          {status.available && status.localUri && (
            <>
              <p style={{ margin: 0, fontWeight: 600, color: "#1d3557" }}>Local video player:</p>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video controls src={status.localUri} style={{ maxWidth: "100%", borderRadius: 8 }} />
            </>
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
