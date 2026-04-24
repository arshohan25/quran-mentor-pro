import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // we register manually with iframe/preview guards
      devOptions: { enabled: false },
      includeAssets: ["favicon.ico", "robots.txt", "placeholder.svg"],
      manifest: {
        name: "Islamic Companion",
        short_name: "Islamic",
        description: "Quran, Hadith, Prayer Times, Duas and more — works offline.",
        theme_color: "#0f3d2e",
        background_color: "#0f3d2e",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/favicon.ico", sizes: "64x64 32x32 24x24 16x16", type: "image/x-icon" },
          { src: "/placeholder.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
          { src: "/placeholder.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api/, /^\/functions\//],
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2}"],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Hadith JSON editions (jsdelivr CDN)
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*\.json$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "hadith-cdn",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            // Google Fonts files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Quran / prayer-time / generic third-party API JSON
            urlPattern: ({ url, request }) =>
              request.destination === "" &&
              /\.(json)$/i.test(url.pathname) &&
              url.origin !== self.location.origin,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-json",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Images
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Audio (recitations)
            urlPattern: ({ request }) => request.destination === "audio",
            handler: "CacheFirst",
            options: {
              cacheName: "audio",
              rangeRequests: true,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200, 206] },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "react-router-dom"],
  },
}));
