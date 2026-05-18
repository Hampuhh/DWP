// The Diplomat wears Prada — service worker minimalista
// Estrategia:
//  - Pre-cache del shell en install (rutas críticas)
//  - Network-first para HTML (para ver actualizaciones)
//  - Cache-first para assets (rápido, offline)

const VERSION = 'tdwp-v3-bolder';
const PRECACHE_URLS = [
  './',
  './mi-closet',
  './generador',
  './mi-paleta',
  './settings',
  './favoritos',
  './favicon.svg',
  './icons/icon-192.png',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) =>
      // ignorar errores individuales (alguna ruta puede no existir todavía)
      Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Ignorar peticiones cross-origin (Google Fonts, CDN, etc.)
  if (url.origin !== self.location.origin) return;

  // HTML: network-first
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached ?? caches.match('./')))
    );
    return;
  }

  // Assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
