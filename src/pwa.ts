// Service Worker Registration
export const registerSW = () => {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration);
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError);
        });
    });
  }
};

// Install prompt handling
export const handleInstallPrompt = () => {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();

    // Show install button or notification
    console.log("PWA install prompt available");

    // You can show a custom install button here
    // For example, show a notification or button to install the app
  });

  window.addEventListener("appinstalled", () => {
    console.log("PWA was installed");
  });
};

// Check if app is running as PWA
export const isPWA = () => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
};
