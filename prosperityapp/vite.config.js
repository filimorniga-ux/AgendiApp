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
      injectRegister: 'auto',
      includeAssets: [
        'favicon-32.png',
        'favicon-16.png',
        'icons/apple-touch-icon.png',
        'icons/icon-192x192.png',
        'icons/icon-512x512.png',
      ],
      manifest: {
        name: 'AgendiApp',
        short_name: 'AgendiApp',
        description: 'Gestión profesional de agendas, inventario y colaboradores para salones y spa.',
        theme_color: '#B8860B',
        background_color: '#1A202C',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/?source=pwa',
        lang: 'es',
        categories: ['business', 'productivity'],
        id: '/agendiapp/',
        icons: [
          { src: '/icons/icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
          { src: '/icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
          { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-192x192.png',        sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/pwa-512x512.png',        sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Nueva Cita',
            short_name: 'Cita',
            description: 'Abrir agenda para nueva cita',
            url: '/?tab=agenda',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
          },
          {
            name: 'Registrar Operación',
            short_name: 'Operación',
            description: 'Registrar venta o servicio',
            url: '/?tab=caja',
            icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,

        // SPA offline fallback
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],

        // New SW takes over immediately on update
        skipWaiting: true,
        clientsClaim: true,

        runtimeCaching: [
          // ── Google Fonts ──────────────────────────────────────────────────
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // ── Supabase Storage (imágenes / recibos) ─────────────────────────
          {
            urlPattern: /^https:\/\/mzoodzsefyaymhjpzopm\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // ── Supabase REST/Auth — NetworkFirst con fallback offline ─────────
          {
            urlPattern: /^https:\/\/mzoodzsefyaymhjpzopm\.supabase\.co\/(rest|auth)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 8,
            },
          },
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],

  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-i18n';
            }
            if (id.includes('sweetalert2') || id.includes('react-hot-toast') || id.includes('feather-icons')) {
              return 'vendor-ui';
            }
          }
        },
      },
    },
  },

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