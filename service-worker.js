// Rhodes - Service worker disabled. Unregister and clear caches.
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) {
        console.log('[SW] Deleting cache:', name);
        return caches.delete(name);
      }));
    }).then(function() {
      return self.clients.claim();
    }).then(function() {
      return self.clients.matchAll();
    }).then(function(clients) {
      clients.forEach(function(client) {
        client.postMessage({type: 'SW_CLEARED'});
      });
    })
  );
});

// Pass everything through to network - no caching
self.addEventListener('fetch', function(e) {
  return;
});
