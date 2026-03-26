const CACHE_NAME = 'arab-tv-v2';
const STATIC_ASSETS = [
  '/s/tv/',
  '/s/tv/index.html',
  '/s/tv/live.html',
  '/s/tv/movies.html',
  '/s/tv/series.html',
  '/s/tv/player.html',
  '/s/tv/css/style.css',
  '/s/tv/css/tv.css',
  '/s/tv/js/app.js',
  '/s/tv/js/live.js',
  '/s/tv/js/movies.js',
  '/s/tv/js/series.js',
  '/s/tv/js/player.js',
  '/s/tv/js/tv.js',
  '/s/tv/manifest.json'
];

// Install
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch - Network first for API, Cache first for static
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET
  if (e.request.method !== 'GET') return;

  // API calls - network only
  if (url.pathname.includes('/api/') ||
      url.hostname === 'api.themoviedb.org' ||
      url.hostname === 'iptv-org.github.io') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Static assets - cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        // Update cache in background
        fetch(e.request).then(response => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, response));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(e.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
