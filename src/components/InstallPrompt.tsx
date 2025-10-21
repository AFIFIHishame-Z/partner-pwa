import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  if (isInstalled) {
    return (
      <div
        style={{
          padding: "10px",
          backgroundColor: "#4CAF50",
          color: "white",
          textAlign: "center",
          borderRadius: "5px",
          margin: "10px 0",
        }}
      >
        ✅ App is installed and running as PWA!
      </div>
    );
  }

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div
      style={{
        padding: "15px",
        backgroundColor: "#2196F3",
        color: "white",
        textAlign: "center",
        borderRadius: "5px",
        margin: "10px 0",
      }}
    >
      <h3>Install Partner App</h3>
      <p>Get the full app experience by installing it on your device!</p>
      <button
        onClick={handleInstallClick}
        style={{
          backgroundColor: "white",
          color: "#2196F3",
          border: "none",
          padding: "10px 20px",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
        }}
      >
        Install App
      </button>
    </div>
  );
};

export default InstallPrompt;
