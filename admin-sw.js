// Service Worker for Admin Dashboard PWA
// 馥靈之鑰管理中心 - Offline & Cache Support
var CACHE_NAME = 'admin-v1';
var ASSETS = [
  '/admin-dashboard.html',
  '/draw-admin.html',
  '/admin-unlock.html',
  '/admin-payments.html',
  '/assets/css/hourlight-global.css',
  '/assets/css/hl-design-tokens.css',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Network-first for API/Firebase, cache-first for static assets
  var url = new URL(e.request.url);

  // Skip non-GET requests
  if (e.request.method !== 'GET') return;

  // Skip Firebase/Google/external APIs - always network
  if (url.hostname !== location.hostname) return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      // For HTML pages, try network first, fall back to cache
      if (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html')) {
        return fetch(e.request).then(function(response) {
          // Update cache with fresh copy
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
          return response;
        }).catch(function() {
          return cached || new Response('Offline - 請連線後重試', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        });
      }
      // For other assets, cache-first
      return cached || fetch(e.request).then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      });
    })
  );
});
