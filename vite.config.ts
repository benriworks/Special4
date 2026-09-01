import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// GitHub Pages serves this project under https://<owner>.github.io/Special4/
const BASE = '/Special4/'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false, // registered from src/app/pwa/UpdateToast.tsx
      manifest: {
        name: '日付のミカタ',
        short_name: '日付のミカタ',
        description: '日本の祝日法を端末内で計算し、今年の連休と有休の使いどきを一枚の地図にするツール。',
        lang: 'ja',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        background_color: '#FBFBF9',
        theme_color: '#FBFBF9',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,png,webmanifest}'],
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  base: BASE,
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
