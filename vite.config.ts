import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/** Escapes text so it can sit inside a RegExp. */
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default defineConfig(({ mode }) => {
  // The Supabase address, so the published-site cache rule below only matches this project's requests.
  const supabaseUrl = loadEnv(mode, ".", "VITE_").VITE_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const supabaseOrigin = supabaseUrl ? escapeRegExp(supabaseUrl) : "https://[a-z0-9-]+\\.supabase\\.(?:co|in)";

  return {
  plugins: [
    react(),
    {
      // Open the connection to Supabase while the app code is still downloading, so the first books request starts sooner.
      name: "preconnect-supabase",
      transformIndexHtml: () => (supabaseUrl ? [{ tag: "link", attrs: { rel: "preconnect", href: supabaseUrl, crossorigin: "" }, injectTo: "head-prepend" as const }] : []),
    },
    VitePWA({
      // New deploys are picked up automatically and the page reloads onto the new version.
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        id: "/",
        name: "Fablebook",
        short_name: "Fablebook",
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
        // Precache only the app shell. Pictures (genre art, template photos, covers) are cached the first time they
        // are seen instead, so a first visit doesn't spend a slow connection downloading images nobody has opened.
        globPatterns: ["**/*.{js,css,html,svg,ico,woff2}", "icons/*.png"],
        // Client-side routing: unknown navigations get index.html.
        // This also covers every author subdomain, because the service worker is per address.
        navigateFallback: "/index.html",
        // API-style paths are never answered with the app shell.
        navigateFallbackDenylist: [/^\/(api|rest|auth|storage|functions|realtime)(\/|$)/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // A published author site (public lookup by address): fresh when the network answers,
            // otherwise a copy at most ~5 minutes old, so "Update site" shows up soon.
            urlPattern: new RegExp(`^${supabaseOrigin}/rest/v1/published_sites\\?(?:.*&)?subdomain=eq\\.`, "i"),
            handler: "NetworkFirst",
            options: {
              cacheName: "published-sites",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 20, maxAgeSeconds: 5 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Book covers uploaded by authors (never change: each upload gets a new file name).
            urlPattern: new RegExp(`^${supabaseOrigin}/storage/v1/object/public/`, "i"),
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // The app's own pictures (hashed build files and demo covers).
            urlPattern: ({ request, url }: { request: Request; url: URL }) => request.destination === "image" && url.origin === self.location.origin,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "app-images",
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] },
            },
          },
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
};
});
