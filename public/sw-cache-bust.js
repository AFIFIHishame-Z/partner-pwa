// Service Worker for Cache Busting
const CACHE_NAME = 'partner-app-cache-bust-v1';
const urlsToCache = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If it's a navigation request, always fetch from network
        if (event.request.mode === 'navigate') {
          return fetch(event.request);
        }
        
        // For other requests, try cache first, then network
        return response || fetch(event.request);
      })
  );
});

// Force cache invalidation on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
