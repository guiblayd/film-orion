/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  ({ url }) => url.hostname === 'image.tmdb.org',
  new CacheFirst({
    cacheName: 'tmdb-images',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
);

registerRoute(
  ({ url }) => url.hostname === 'api.dicebear.com',
  new CacheFirst({
    cacheName: 'avatars',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 })],
  }),
);

registerRoute(
  ({ url }) => url.hostname === 'rtkyfoiwnnzvcohlnfvw.supabase.co' && url.pathname.startsWith('/storage/'),
  new StaleWhileRevalidate({
    cacheName: 'supabase-storage',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 })],
  }),
);

registerRoute(
  new NavigationRoute(new NetworkFirst({ cacheName: 'pages' }), {
    denylist: [/^\/api\//],
  }),
);

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data: { title?: string; body?: string; url?: string } = {};
  try { data = event.data.json(); } catch { data = { body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'FilmOrion', {
      body: data.body ?? 'Você tem uma nova notificação.',
      icon: '/icon-192x192.svg',
      badge: '/icon-72x72.svg',
      data: { url: data.url ?? '/notifications' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/notifications';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus().then(c => c.navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});
