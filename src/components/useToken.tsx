import { useState, useEffect } from "react";
import {
  TokenProvider,
  type TokenResponse,
} from "@superapp_men/token-provider";

export function useToken() {
  const [provider] = useState(() => new TokenProvider());
  const [token, setToken] = useState<TokenResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = provider.on("tokenReceived", ({ token }: any) => {
      setToken(token);
      setLoading(false);
    });

    const errorUnsub = provider.on("error", ({ message }: any) => {
      setError(message);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      errorUnsub();
      provider.destroy();
    };
  }, [provider]);

  const getToken = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await provider.getToken();
      return token;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { token, loading, error, getToken, provider };
}

// Usage
export function MyComponent() {
  const { token, loading, getToken } = useToken();

  useEffect(() => {
    getToken();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <p>Token: {token?.token.substring(0, 20)}...</p>
      <button onClick={getToken}>Get New Token</button>
    </div>
  );
}
