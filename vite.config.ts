import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      pwaAssets: { config: true },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/, /supabase\.co/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
      },
      manifest: {
        name: 'Monitor Igiene',
        short_name: 'Monitor',
        description: 'Raccolta misure di monitoraggio igiene del lavoro D.Lgs. 81/08',
        theme_color: '#1E407C',
        background_color: '#1E407C',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'it',
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    // NB: in Vite 8 (rolldown) `rollupOptions` è un alias deprecato di
    // `rolldownOptions`. L'API `output.manualChunks` è identica su entrambe.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            // exceljs/jszip: NON forzare — restano nel loro chunk dinamico on-demand
            if (id.includes('exceljs') || id.includes('jszip')) return
            if (
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('/react/') ||
              id.includes('scheduler')
            )
              return 'vendor-react'
            if (id.includes('@supabase')) return 'vendor-supabase'
            if (id.includes('dexie')) return 'vendor-dexie'
            if (id.includes('@tanstack')) return 'vendor-query'
            return 'vendor'
          }
        },
      },
    },
  },
})
