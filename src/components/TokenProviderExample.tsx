import { useEffect, useState } from "react";
import {
  TokenProvider,
  TokenProviderState,
  decodeJWT,
} from "@superapp_men/token-provider";

export function TokenProviderExample() {
  const [tokenProvider] = useState(
    () =>
      new TokenProvider({
        timeout: 5000,
        debug: true,
      })
  );

  const [state, setState] = useState<TokenProviderState>(
    TokenProviderState.IDLE
  );
  const [token, setToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // Listen to state changes
    const unsubState = tokenProvider.on("stateChange", ({ state }: any) => {
      setState(state);
    });

    // Listen to token received events
    const unsubToken = tokenProvider.on("tokenReceived", ({ token }: any) => {
      setToken(token.token);
      setError(null);
    });

    // Listen to errors
    const unsubError = tokenProvider.on("error", ({ message }: any) => {
      setError(message);
      setToken(null);
    });

    return () => {
      unsubState();
      unsubToken();
      unsubError();
      tokenProvider.destroy();
    };
  }, [tokenProvider]);

  const handleGetToken = async () => {
    try {
      setError(null);
      const tokenResponse = await tokenProvider.getToken();
      setToken(tokenResponse.token);

      // Decode the JWT token
      const decoded = decodeJWT(tokenResponse.token);
      setDecodedToken(decoded);

      console.log("Token received:", tokenResponse);
      console.log("Decoded token:", decoded);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get token");
      console.error("Error getting token:", e);
      setDecodedToken(null);
    }
  };

  const handleGetUserInfo = async () => {
    try {
      setError(null);
      const info = await tokenProvider.getUserInfo();
      setUserInfo(info);
      console.log("User info received:", info);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get user info");
      console.error("Error getting user info:", e);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2 style={{ marginBottom: "20px", color: "#333" }}>
        🔑 Token Provider Example
      </h2>

      <div
        style={{
          background: "#f5f5f5",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <strong>Stateee:</strong>{" "}
          <span
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              background:
                state === TokenProviderState.READY
                  ? "#4caf50"
                  : state === TokenProviderState.ERROR
                  ? "#f44336"
                  : state === TokenProviderState.REQUESTING
                  ? "#ff9800"
                  : "#9e9e9e",
              color: "white",
              fontSize: "12px",
            }}
          >
            {state}
          </span>
        </div>

        {error && (
          <div
            style={{
              padding: "10px",
              background: "#ffebee",
              color: "#c62828",
              borderRadius: "4px",
              marginBottom: "10px",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {token && (
          <>
            <div
              style={{
                padding: "10px",
                background: "#e8f5e9",
                borderRadius: "4px",
                marginBottom: "10px",
                wordBreak: "break-all",
              }}
            >
              <strong>Token:</strong>{" "}
              <code style={{ fontSize: "12px" }}>
                {token.substring(0, 50)}...
              </code>
            </div>

            {decodedToken && (
              <div
                style={{
                  padding: "10px",
                  background: "#fff3e0",
                  borderRadius: "4px",
                  marginBottom: "10px",
                }}
              >
                <strong>Decoded JWT Payload:</strong>
                <pre style={{ fontSize: "12px", marginTop: "5px" }}>
                  {JSON.stringify(decodedToken, null, 2)}
                </pre>
              </div>
            )}
          </>
        )}

        {userInfo && (
          <div
            style={{
              padding: "10px",
              background: "#e3f2fd",
              borderRadius: "4px",
              marginBottom: "10px",
            }}
          >
            <strong>User Info:</strong>
            <pre style={{ fontSize: "12px", marginTop: "5px" }}>
              {JSON.stringify(userInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          onClick={handleGetToken}
          disabled={state === TokenProviderState.REQUESTING}
          style={{
            padding: "10px 20px",
            background:
              state === TokenProviderState.REQUESTING ? "#ccc" : "#2196f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              state === TokenProviderState.REQUESTING
                ? "not-allowed"
                : "pointer",
            fontSize: "14px",
          }}
        >
          {state === TokenProviderState.REQUESTING
            ? "Requesting..."
            : "Get Token"}
        </button>

        <button
          onClick={handleGetUserInfo}
          disabled={state === TokenProviderState.REQUESTING}
          style={{
            padding: "10px 20px",
            background:
              state === TokenProviderState.REQUESTING ? "#ccc" : "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              state === TokenProviderState.REQUESTING
                ? "not-allowed"
                : "pointer",
            fontSize: "14px",
          }}
        >
          Get User Info
        </button>
      </div>
    </div>
  );
}
