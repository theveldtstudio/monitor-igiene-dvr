import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
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
})
