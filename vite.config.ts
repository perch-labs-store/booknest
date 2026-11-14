import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // New deploys are picked up automatically and the page reloads onto the new version.
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        id: "/",
        name: "BookNest",
        short_name: "BookNest",
        description: "Discover books, genres and authors, and follow the ones you love.",
        lang: "en",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#0B0B0D",
        theme_color: "#0B0B0D",
        categories: ["books", "entertainment", "lifestyle"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        // Long-press the app icon (Android / Windows / macOS) for quick links.
        shortcuts: [
          { name: "Search", url: "/search", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "Genres", url: "/genres", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          { name: "New Releases", url: "/new-releases", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
        ],
      },
      workbox: {
        // Adds the push-notification handlers (public/push-sw.js) to the generated service worker.
        importScripts: ["push-sw.js"],
        // Precache the app shell + book covers so the app opens offline.
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,ico,woff2}"],
        // Client-side routing: unknown navigations get index.html.
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-styles" },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-files",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
