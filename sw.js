// 馥靈之鑰 Hour Light - Service Worker
// 策略：HTML 絕不快取，CSS/JS/圖片才快取
const CACHE_NAME = 'hourlight-v20260309-b';

// 安裝：跳過等待，直接接管
self.addEventListener('install', event => {
  self.skipWaiting();
});

// 啟動：清除所有舊快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 攔截請求
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  // HTML 一律走網路，不碰快取
  if (
    event.request.mode === 'navigate' ||
    event.request.url.endsWith('.html') ||
    event.request.url.endsWith('/')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // CSS / JS / 字型 / 圖片：Cache First
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
});
