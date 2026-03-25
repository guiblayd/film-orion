import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'icon-*.svg'],
        manifest: {
          name: 'Indica',
          short_name: 'Indica',
          description: 'Compartilhe o que vale a pena assistir',
          theme_color: '#09090b',
          background_color: '#09090b',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          lang: 'pt-BR',
          icons: [
            { src: '/icon-72x72.svg',   sizes: '72x72',   type: 'image/svg+xml' },
            { src: '/icon-96x96.svg',   sizes: '96x96',   type: 'image/svg+xml' },
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
              label: 'Feed do Indica',
            },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/image\.tmdb\.org\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'tmdb-images',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: /^https:\/\/api\.dicebear\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'avatars',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
          ],
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
