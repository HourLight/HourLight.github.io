// 馥靈之鑰 Hour Light - Service Worker
const CACHE_NAME = 'hourlight-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/background.jpg',
  '/HOUR-LIGHT.png',
  '/assets/global.css'
];

// 安裝：快取靜態資源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

// 啟動：清除舊快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 攔截請求
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // 只處理同源請求
  if (url.origin !== location.origin) return;

  if (event.request.url.endsWith('.html') || event.request.url.endsWith('/')) {
    // HTML：Network First（優先最新版）
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    // 靜態資源：Cache First（優先快取，快）
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
