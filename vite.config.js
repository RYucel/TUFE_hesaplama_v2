import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/TUFE_hesaplama_v2/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'TÜFE Hesaplayıcı',
        short_name: 'TÜFE',
        description: 'TÜFE Değişim Hesaplayıcı',
        theme_color: '#3182CE',
        icons: [
          {
            src: '/TUFE_hesaplama_v2/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/TUFE_hesaplama_v2/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})