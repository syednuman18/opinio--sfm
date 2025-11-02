const CACHE_NAME = 'opinio-cache-v1';
const OFFLINE_URL = 'offline.html';

const urlsToCache = [
  'https://syednuman18.github.io/opinio--sfm/',
  'https://syednuman18.github.io/opinio--sfm/signup.html',
  'https://syednuman18.github.io/opinio--sfm/index.html',
  'https://syednuman18.github.io/opinio--sfm/admin.html',
  'https://syednuman18.github.io/opinio--sfm/manage.html',
  'https://syednuman18.github.io/opinio--sfm/result.html',
  'https://syednuman18.github.io/opinio--sfm/manifest.json',
  'https://syednuman18.github.io/opinio--sfm/icon/icon-192.png',
  'https://syednuman18.github.io/opinio--sfm/icon/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        // swallow errors for individual resources but still install
        console.warn('Some resources failed to precache:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      });
    })
  );
});


  // Navigation requests -> try network first, fallback to cache, then offline page
  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(req).then(response => {
        // update cache
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return response;
      }).catch(() =>
        caches.match(req).then(cacheRes => cacheRes || caches.match(OFFLINE_URL))
      )
    );
    return;
  }

  // For other resources: try cache first, then network
  event.respondWith(
    caches.match(req).then(cacheRes => {
      return cacheRes || fetch(req).then(networkRes => {
        // cache same-origin resources
        if (req.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then(cache => cache.put(req, networkRes.clone()));
        }
        return networkRes;
      }).catch(() => {
        // optional: return a fallback image for images if desired
        return caches.match('./icon/icon-192.png');
      });
    })
  );