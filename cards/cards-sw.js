/* RhodesCards Service Worker — Offline Support
   Caches app shell + vendor libs for offline access.
   API calls fall back to IndexedDB cache when offline. */

const CACHE_NAME = 'rhodescards-v7';
const APP_SHELL = [
    '/cards/',
    '/cards/index.html',
    '/cards/cards.css?v=7',
    '/cards/js/utils.js?v=7',
    '/cards/js/api.js?v=7',
    '/cards/js/templates.js?v=7',
    '/cards/js/media.js?v=7',
    '/cards/js/search.js?v=7',
    '/cards/js/decks.js?v=7',
    '/cards/js/review.js?v=7',
    '/cards/js/browse.js?v=7',
    '/cards/js/add.js?v=7',
    '/cards/js/import.js?v=7',
    '/cards/js/stats.js?v=7',
    '/cards/js/occlusion.js?v=7',
    '/cards/js/app.js?v=7',
    '/cards/lib/marked.min.js',
    '/cards/lib/purify.min.js',
    '/cards/lib/katex.min.js',
    '/cards/lib/katex.min.css',
    '/cards/lib/auto-render.min.js',
];

// Install: cache app shell
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(APP_SHELL);
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(key) {
                    return key.startsWith('rhodescards-') && key !== CACHE_NAME;
                }).map(function(key) {
                    return caches.delete(key);
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', function(event) {
    var url = new URL(event.request.url);

    // API requests: network-first, cache response for offline
    if (url.pathname.startsWith('/api/cards/')) {
        event.respondWith(
            fetch(event.request.clone()).then(function(response) {
                if (response.ok && event.request.method === 'GET') {
                    var responseClone = response.clone();
                    caches.open(CACHE_NAME + '-api').then(function(cache) {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            }).catch(function() {
                // Offline: try cache
                return caches.match(event.request).then(function(cached) {
                    if (cached) return cached;
                    return new Response(JSON.stringify({
                        error: 'Offline - data not cached',
                        offline: true
                    }), {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    });
                });
            })
        );
        return;
    }

    // Static assets: cache-first
    if (url.pathname.startsWith('/cards/')) {
        event.respondWith(
            caches.match(event.request).then(function(cached) {
                if (cached) return cached;
                return fetch(event.request).then(function(response) {
                    if (response.ok) {
                        var responseClone = response.clone();
                        caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Media files: cache on first access
    if (url.pathname.startsWith('/cards-media/')) {
        event.respondWith(
            caches.match(event.request).then(function(cached) {
                if (cached) return cached;
                return fetch(event.request).then(function(response) {
                    if (response.ok) {
                        var responseClone = response.clone();
                        caches.open(CACHE_NAME + '-media').then(function(cache) {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Everything else: network only
    event.respondWith(fetch(event.request));
});
