import { useState, useCallback } from "react";
import { ContentProviderClient } from "@superapp_men/content-provider";

export function ContentProviderTest() {
  const [partnerCode, setPartnerCode] = useState("poc");
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [result, setResult]         = useState<string>("");

  const handleGetContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResult("");
    const client = new ContentProviderClient({ partnerCode, timeout: 15000, debug: true });
    try {
      const content = await client.getContent();
      setResult(JSON.stringify(content, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      client.destroy();
      setIsLoading(false);
    }
  }, [partnerCode]);

  return (
    <div style={card}>
      <h2 style={{ marginTop: 0, color: "#1d3557" }}>ContentProviderClient — getContent()</h2>
      <p style={{ color: "#4f5d75", fontSize: 14, marginTop: 0 }}>
        Fetches the student's grade-specific <code>content.json</code> from the SuperApp via postMessage.
      </p>

      <label style={labelStyle}>
        Partner code
        <input
          value={partnerCode}
          onChange={(e) => setPartnerCode(e.target.value)}
          style={inputStyle}
        />
      </label>

      <button
        type="button"
        onClick={() => void handleGetContent()}
        disabled={isLoading}
        style={btn("#2563eb", isLoading)}
      >
        {isLoading ? "Loading…" : "getContent()"}
      </button>

      {error && <div style={errorBox}><strong>Error:</strong> {error}</div>}

      {result && (
        <div style={resultBox}>
          <strong>Result (first 2 000 chars):</strong>
          <pre style={pre}>{result.slice(0, 2000)}{result.length > 2000 ? "\n… (truncated)" : ""}</pre>
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
  padding: 10, borderRadius: 6, background: "#eef6ff", border: "1px solid #cfe2ff",
};
const pre: React.CSSProperties = {
  marginTop: 8, marginBottom: 0, whiteSpace: "pre-wrap",
  wordBreak: "break-word", fontFamily: "ui-monospace,monospace", fontSize: 13,
};
function btn(color: string, disabled: boolean): React.CSSProperties {
  return {
    padding: "8px 16px", border: "none", borderRadius: 6,
    background: disabled ? "#94a3b8" : color, color: "#fff",
    cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14,
    alignSelf: "flex-start",
  };
}
