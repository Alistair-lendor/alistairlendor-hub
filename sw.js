const CACHE = 'alistair-v4';
const VERSION = 4;

const PRECACHE = [
  '/manifest.json',
  '/alistair-logo.png',
  '/alistair-logo-hires.png'
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
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  
  const url = new URL(request.url);
  
  // Only cache static assets (images, fonts), NOT HTML or API data
  const isStatic = /\.(png|jpg|jpeg|gif|svg|ico|woff2?)$/i.test(url.pathname);
  
  if (isStatic) {
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
    return;
  }
  
  // HTML, JSON, and everything else: always fetch from network, no caching
  event.respondWith(fetch(request).catch(() => 
    caches.match(request).then(cached => 
      cached || new Response('Offline', { status: 503 })
    )
  ));
});
