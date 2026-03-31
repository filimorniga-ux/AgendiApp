import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'favicon-16.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'AgendiApp',
        short_name: 'AgendiApp',
        description: 'Gestión profesional de agendas, inventario y colaboradores para salones y spa.',
        theme_color: '#1A202C',
        background_color: '#1A202C',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'es',
        icons: [
          { src: '/icons/icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
          { src: '/icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: '/pwa-192x192.png',        sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png',        sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Cachea todos los assets de la app (JS, CSS, HTML, imágenes)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        // Estrategia: StaleWhileRevalidate para assets internos
        // (carga desde caché inmediatamente, actualiza en background si hay red)
        runtimeCaching: [
          // ── Google Fonts ────────────────────────────────────────────────────
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 año
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // ── Supabase API (datos) ────────────────────────────────────────────
          // NetworkFirst: intenta red primero, si falla usa caché
          {
            urlPattern: /^https:\/\/mzoodzsefyaymhjpzopm\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }, // 24h
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 10,
            },
          },
        ],
        // Permite cachear el bundle principal de ~2.3 MB (límite subido a 4 MiB)
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },

      devOptions: {
        enabled: false, // Solo activo en build de producción
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
  base: '/',
  server: {
    port: 5173,
    open: true,
  },
})