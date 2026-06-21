const CACHE = 'alistair-v2';
const VERSION = 2;
const PRECACHE = [
  '/',
  '/manifest.json',
  '/alistair-logo.png',
  '/portfolio-latest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    caches.match(request).then(cached =>
      fetch(request)
        .then(response => {
          const clone = response.clone();
          if (response.ok) caches.open(CACHE).then(c => c.put(request, clone));
          return response;
        })
        .catch(() => cached || new Response('Offline', { status: 503 }))
    )
  );
});
