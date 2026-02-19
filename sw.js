/* RHODES AI service worker - MINIMAL, NO FALLBACK */
const CACHE_NAME = "rhodes-v20260129-debug1";

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // DO NOTHING - let all requests go to network
  // No caching, no interception, no fallback
  return;
});
