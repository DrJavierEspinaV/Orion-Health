const CACHE_NAME = 'orion-dental-app-v1.2.1';
const SHELL = [
  './',
  './index.html',
  './styles-1.css',
  './script-1.js',
  './manifest.webmanifest',
  './VERSION.json',
  './assets/brand/orion-health.png',
  './assets/brand/orion-comunicaciones.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/shared/patient-bridge.js',
  './assets/shared/session-config.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const dynamic = request.mode === 'navigate' || /\.(?:html|js|css|part|json)$/.test(url.pathname);
  if (dynamic) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
      return response;
    }))
  );
});
