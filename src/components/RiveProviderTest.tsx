import { useState, useCallback } from "react";
import { RiveProviderClient } from "@superapp_men/content-provider";

export function RiveProviderTest() {
  const [partnerCode, setPartnerCode] = useState("poc");
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [result, setResult]           = useState<string | null>(null);

  const handleLoad = useCallback(async () => {
    setError(null);
    setResult(null);
    setIsLoading(true);
    const client = new RiveProviderClient({ partnerCode, timeout: 30000, debug: true });
    try {
      const { primary, fallback } = await client.getRiveBuffers();
      setResult(
        `Success — received both Rive WASM runtime files:\n` +
        `• rive.wasm          ${primary.byteLength.toLocaleString()} bytes\n` +
        `• rive_fallback.wasm ${fallback.byteLength.toLocaleString()} bytes\n\n` +
        `Pass primaryUrl to RuntimeLoader.setWasmUrl() before mounting Rive.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      client.destroy();
      setIsLoading(false);
    }
  }, [partnerCode]);

  return (
    <div style={card}>
      <h2 style={{ marginTop: 0, color: "#1d3557" }}>RiveProviderClient — getRive()</h2>
      <p style={{ color: "#4f5d75", fontSize: 14, marginTop: 0 }}>
        Fetches both <code>rive.wasm</code> and <code>rive_fallback.wasm</code> from the
        SuperApp's static assets via postMessage. Use the buffers with{" "}
        <code>RuntimeLoader.setWasmUrl()</code> before mounting any Rive component.
      </p>

      <label style={labelStyle}>
        Partner code
        <input value={partnerCode} onChange={(e) => setPartnerCode(e.target.value)} style={inputStyle} />
      </label>

      <button
        type="button"
        onClick={() => void handleLoad()}
        disabled={isLoading}
        style={btn("#7c3aed", isLoading)}
      >
        {isLoading ? "Loading…" : "Load Rive WASM files"}
      </button>

      {error  && <div style={errorBox}><strong>Error:</strong> {error}</div>}
      {result && <pre style={resultBox}>{result}</pre>}
    </div>
  );
}

const card: React.CSSProperties = {
  padding: "20px", maxWidth: 800, margin: "20px auto",
  border: "1px solid #dbe3ec", borderRadius: 10,
  background: "#faf8ff", fontFamily: "system-ui, sans-serif",
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
  padding: 10, borderRadius: 6, background: "#f5f3ff",
  border: "1px solid #ddd6fe", color: "#4c1d95", fontSize: 13,
  whiteSpace: "pre-wrap", margin: 0,
};
function btn(color: string, disabled: boolean): React.CSSProperties {
  return {
    padding: "8px 16px", border: "none", borderRadius: 6,
    background: disabled ? "#94a3b8" : color, color: "#fff",
    cursor: disabled ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 14,
    alignSelf: "flex-start",
  };
}
