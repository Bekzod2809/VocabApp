import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    // Telefondan ham ochish uchun (bitta Wi-Fi'da): http://<laptop-ip>:5173
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      // APK ichida fayllar ilovaning o'zida turadi, service worker kerak emas
      disable: mode === 'android',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'VocabApp',
        short_name: 'VocabApp',
        description: "So'z yodlash uchun flashcards",
        lang: 'uz',
        display: 'standalone',
        start_url: '/',
        background_color: '#f7f7f5',
        theme_color: '#4f46e5',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
}))
