import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png", "favicon.ico", "icons/*.png"],
      manifest: {
        name: "বাক্বারাহ এগ্রো | BAQARAH AGRO",
        short_name: "BAQARAH AGRO",
        description: "বাক্বারাহ এগ্রো - আধুনিক ও স্মার্ট ফার্ম ম্যানেজমেন্ট সলিউশন",
        theme_color: "#f59e0b",
        background_color: "#080c18",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "bn",
        icons: [
          {
            src: "icons/logo-512.png", // আপডেট করা হয়েছে
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "icons/logo-512.png", // আপডেট করা হয়েছে
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          }
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});