import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-*.svg'],
      manifest: {
        name: 'FilmOrion',
        short_name: 'FilmOrion',
        description: 'Compartilhe o que vale a pena assistir',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'pt-BR',
        icons: [
          { src: '/icon-72x72.svg', sizes: '72x72', type: 'image/svg+xml' },
          { src: '/icon-96x96.svg', sizes: '96x96', type: 'image/svg+xml' },
          { src: '/icon-128x128.svg', sizes: '128x128', type: 'image/svg+xml' },
          { src: '/icon-144x144.svg', sizes: '144x144', type: 'image/svg+xml' },
          { src: '/icon-152x152.svg', sizes: '152x152', type: 'image/svg+xml' },
          { src: '/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-384x384.svg', sizes: '384x384', type: 'image/svg+xml' },
          { src: '/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
        screenshots: [
          {
            src: '/screenshot.svg',
            sizes: '390x844',
            type: 'image/svg+xml',
            form_factor: 'narrow',
            label: 'Feed do FilmOrion',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
