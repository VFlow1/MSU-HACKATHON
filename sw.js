const CACHE_NAME = 'ai-talent-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './ai-talent-dashboard.html',
  './css/style.css',
  './js/data.js',
  './js/charts.js',
  './js/shader.js',
  './js/effects.js',
  './js/app.js',
  './manifest.json',
  './icons/icon.svg',
  './users.json',
  './data/users.json',
  './data/projects.json',
  './data/tasks.json',
  './data/courses.json',
  './data/enrollments.json'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching PWA assets...');
      return cache.addAll(ASSETS);
    })
  );
});

// Activate Service Worker & Clean Old Caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch Cache First (Offline Capability)
self.addEventListener('fetch', event => {
  // Only handle local scheme requests (exclude external API calls to avoid cache conflicts)
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(response => {
          // Cache newly fetched local items dynamically
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      }).catch(() => {
        // Fallback for offline mode if asset is not cached
        return new Response('แอปพลิเคชันกำลังทำงานในโหมดออฟไลน์ และไม่พบทรัพยากรที่เรียกใช้ในแคช', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
    );
  }
});
