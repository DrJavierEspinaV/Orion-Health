const CACHE_NAME = 'orion-portal-v1';

// App shell (solo lo que vive en ESTE repo). Ojo: GitHub Pages sirve desde /<repo>/
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './orion-logo.png',
  './logo_orion_health_spa_oficial_azul.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(()=>{}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve())
    ))
  );
  self.clients.claim();
});

// Estrategia:
// - Same-origin: cache-first (rápido)
// - Cross-origin (CDN xlsx, Google Apps Script): network-first (datos siempre frescos)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  const sameOrigin = url.origin === self.location.origin;

  if (!sameOrigin) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(()=>{});
      return res;
    }).catch(() => cached))
  );
});
