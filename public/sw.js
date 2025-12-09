self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('offline-cache')
      .then(cache => {
        cache.add('offline.html');
        cache.add('/main.css');
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        caches.open('offline-cache')
          .then(cache => {
            cache.put(event.request, response.clone());
          });
        return response;
      })
      .catch(() => {
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('offline.html');
        } else if (event.request.url.includes('/main.css')) {
          return caches.match('/main.css');
        } else {
          return Promise.reject('Unable to load resource');
        }
      })
  );
});
