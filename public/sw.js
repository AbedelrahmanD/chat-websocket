const CACHE_NAME = 'chatapp-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
];

// Install event - Pre-cache core shell resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event - Clean up legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Intercept and cache requests intelligently
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Skip dev tool servers, WebSockets, or Laravel debug / broadcast endpoints
  if (
    url.pathname.startsWith('/_debugbar') ||
    url.pathname.startsWith('/__vite_ping') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/app/') ||
    url.pathname.includes('websocket') ||
    url.pathname.includes('/broadcasting/') ||
    url.pathname.includes('/reverb') ||
    url.hostname !== self.location.hostname
  ) {
    return;
  }

  // Caching Strategy:
  // 1. Static and Compiled Assets (CSS, JS, WebFonts, images, icons): Cache-First
  const isAsset = url.pathname.startsWith('/build/') || 
                  url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|css|js)$/);

  if (isAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          return new Response('Asset offline', { status: 404 });
        });
      })
    );
  } else {
    // 2. Pages / Dynamic Data (Inertia data requests, HTML pages): Network-First with Cache fallback
    event.respondWith(
      fetch(request).then((networkResponse) => {
        // Cache successful page/JSON responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If network fails, try the cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If the request is for an HTML page and not found, return the cached root "/"
          if (request.headers.get('Accept')?.includes('text/html')) {
            return caches.match('/');
          }
          return new Response('Offline - Network disconnected', { status: 503, statusText: 'Offline' });
        });
      })
    );
  }
});

// Push event - Handle incoming web push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'New Message',
      body: event.data.text()
    };
  }

  const options = {
    body: data.body || 'You have received a new message.',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.data?.url || '/chat'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'New Message', options)
  );
});

// Notification click event - Focus or open the app when the banner is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/chat';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if the chat app is already open in any tab
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname === targetUrl || clientUrl.pathname === '/chat' || clientUrl.pathname === '/') {
          if ('focus' in client) {
            // Focus on the existing tab
            return client.focus();
          }
        }
      }
      // If no tab is open, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
