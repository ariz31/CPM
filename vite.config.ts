import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'CPM Enterprise Project Controls',
        short_name: 'CPM',
        description: 'Offline-first construction scheduling and project controls.',
        theme_color: '#0b1220',
        background_color: '#07101e',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false
      }
    })
  ],
  build: {
    target: 'es2022',
    sourcemap: true
  },
  worker: {
    format: 'es'
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
