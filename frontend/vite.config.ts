import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
      },
      manifest: {
        name: 'Spotify#NowPlaying',
        short_name: 'NowPlaying',
        description: 'Spotify Controller & Viewer',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        start_url: '/admin', // Appとして開くとAdminになる
        icons: [
          {
            src: 'pwa-192x192.jpg', // publicフォルダにアイコン画像を置いてください(任意)
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.jpg',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
    })
  ],
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3333'
    }
  }
})
