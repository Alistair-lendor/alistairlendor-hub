const CACHE = 'alistair-v7';
const VERSION = 7;

self.addEventListener('install', event => {
  // Force activation without waiting for old tabs
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    // Delete ALL caches — don't bother keeping any from old versions
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => {
      // Immediately take control of all clients
      return self.clients.claim();
    }).then(() => {
      // Tell all open tabs to reload so they get the new version
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED', version: VERSION });
        });
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // HTML and navigation requests: ALWAYS fetch from network, zero caching
  if (request.mode === 'navigate' || request.destination === 'document' ||
      /\.html$/.test(url.pathname) || url.pathname === '/' || url.pathname === '') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() =>
        new Response('Offline — please check your connection.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        })
      )
    );
    return;
  }

  // Static assets: cache-first with network update
  const isStatic = /\.(png|jpg|jpeg|gif|svg|ico|woff2?|css|js)$/i.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(request).then(cached => {
          const fetchPromise = fetch(request, { cache: 'no-store' }).then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Everything else: network-first with offline fallback
  event.respondWith(
    fetch(request, { cache: 'no-store' }).catch(() =>
      caches.match(request).then(cached =>
        cached || new Response('Offline', { status: 503 })
      )
    )
  );
});
