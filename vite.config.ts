import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // "./" makes all asset paths relative to index.html —
  // works both on Vercel ("/") and when served from a subfolder on-device.
  base: "./",
  build: {
    // Optimize for PWA and Vercel deployment
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
        // Ensure consistent asset naming
        assetFileNames: "assets/[name]-[hash][extname]",
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
  server: {
    // Enable host access for PWA testing
    host: true,
  },
  // Ensure proper MIME types for assets
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "production"
    ),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
