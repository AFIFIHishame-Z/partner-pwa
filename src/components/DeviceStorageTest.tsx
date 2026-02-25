import { useCallback, useEffect, useMemo, useState } from "react";
import { DeviceStorageClient } from "@superapp_men/device-storage";

const PARTNER_CODES = [
  "bewize",
  "ltm",
  "cantoo",
  "ekinox",
  "math-scan",
] as const;

type PartnerCode = (typeof PARTNER_CODES)[number];

export function DeviceStorageTest() {
  const [partnerCode, setPartnerCode] = useState<PartnerCode>("bewize");
  const [key, setKey] = useState("device-storage-test-key");
  const [value, setValue] = useState("hello-from-partner-app");
  const [result, setResult] = useState<string>("");
  const [keys, setKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storage = useMemo(
    () =>
      new DeviceStorageClient({
        partnerCode,
        timeout: 10000,
        debug: true,
      }),
    [partnerCode],
  );

  useEffect(() => {
    return () => {
      storage.destroy();
    };
  }, [storage]);

  const run = useCallback(async (fn: () => Promise<void>) => {
    setIsLoading(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Storage request failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSet = useCallback(() => {
    void run(async () => {
      await storage.set(key, value);
      setResult(`Saved key "${key}".`);
    });
  }, [key, run, storage, value]);

  const handleGet = useCallback(() => {
    void run(async () => {
      const storedValue = await storage.get(key);
      if (storedValue === null) {
        setResult(`No value found for "${key}".`);
        return;
      }
      setResult(storedValue);
    });
  }, [key, run, storage]);

  const handleHas = useCallback(() => {
    void run(async () => {
      const exists = await storage.has(key);
      setResult(
        exists ? `Key "${key}" exists.` : `Key "${key}" does not exist.`,
      );
    });
  }, [key, run, storage]);

  const handleRemove = useCallback(() => {
    void run(async () => {
      await storage.remove(key);
      setResult(`Removed key "${key}".`);
    });
  }, [key, run, storage]);

  const handleKeys = useCallback(() => {
    void run(async () => {
      const list = await storage.keys();
      setKeys(list);
      setResult(`Found ${list.length} key(s).`);
    });
  }, [run, storage]);

  const handleClear = useCallback(() => {
    void run(async () => {
      await storage.clear();
      setKeys([]);
      setResult("Cleared all keys for the selected partner.");
    });
  }, [run, storage]);

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "20px auto",
        border: "1px solid #dbe3ec",
        borderRadius: "10px",
        background: "#f8fbff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "10px", color: "#1d3557" }}>
        Device Storage Test
      </h2>
      <p style={{ marginTop: 0, color: "#4f5d75", fontSize: "14px" }}>
        Test storage operations through SuperApp bridge (iframe/Capacitor).
      </p>

      <div
        style={{
          display: "grid",
          gap: "10px",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          marginBottom: "12px",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          Partner code
          <select
            value={partnerCode}
            onChange={(e) => setPartnerCode(e.target.value as PartnerCode)}
            style={inputStyle}
          >
            {PARTNER_CODES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          Key
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            gridColumn: "1 / -1",
          }}
        >
          Value
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "ui-monospace, SFMono-Regular, monospace",
            }}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleSet}
          disabled={isLoading}
          style={buttonStyle("#2563eb", isLoading)}
        >
          set
        </button>
        <button
          type="button"
          onClick={handleGet}
          disabled={isLoading}
          style={buttonStyle("#2563eb", isLoading)}
        >
          get
        </button>
        <button
          type="button"
          onClick={handleHas}
          disabled={isLoading}
          style={buttonStyle("#2563eb", isLoading)}
        >
          has
        </button>
        <button
          type="button"
          onClick={handleRemove}
          disabled={isLoading}
          style={buttonStyle("#ef4444", isLoading)}
        >
          remove
        </button>
        <button
          type="button"
          onClick={handleKeys}
          disabled={isLoading}
          style={buttonStyle("#0ea5e9", isLoading)}
        >
          keys
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading}
          style={buttonStyle("#f97316", isLoading)}
        >
          clear
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: "12px",
            padding: "10px",
            borderRadius: "6px",
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            fontSize: "14px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      <div
        style={{
          marginTop: "12px",
          padding: "10px",
          borderRadius: "6px",
          background: "#eef6ff",
          border: "1px solid #cfe2ff",
        }}
      >
        <strong>Result:</strong>
        <pre
          style={{
            marginTop: "8px",
            marginBottom: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: "13px",
          }}
        >
          {result || "No result yet."}
        </pre>
      </div>

      <div
        style={{
          marginTop: "12px",
          padding: "10px",
          borderRadius: "6px",
          background: "#f1f5f9",
          border: "1px solid #dbe3ec",
        }}
      >
        <strong>Partner keys:</strong>
        <pre
          style={{
            marginTop: "8px",
            marginBottom: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "ui-monospace, SFMono-Regular, monospace",
            fontSize: "13px",
          }}
        >
          {keys.length > 0 ? JSON.stringify(keys, null, 2) : "[]"}
        </pre>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  padding: "8px 10px",
  fontSize: "14px",
  boxSizing: "border-box",
};

function buttonStyle(color: string, disabled: boolean): React.CSSProperties {
  return {
    padding: "8px 14px",
    border: "none",
    borderRadius: "6px",
    background: disabled ? "#94a3b8" : color,
    color: "#fff",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 600,
    fontSize: "14px",
  };
}
