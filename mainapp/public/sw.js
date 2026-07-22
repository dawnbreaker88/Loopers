const CACHE_NAME = 'loopers-pwa-v2';
const STATIC_ASSETS = [
  '/app/',
  '/app/index.html',
  '/app/manifest.json',
  '/app/loopers.svg',
  '/app/logo.svg',
  '/app/pwa-192x192.png',
  '/app/pwa-512x512.png',
  '/app/maskable-icon.png',
  '/app/monochrome-icon.svg',
  '/app/apple-touch-icon.png'
];

// Install Event - Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== 'loopers-images-cache') {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message Event - Skip Waiting to apply updates instantly
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event - Dynamic caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests or browser extensions
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. API Endpoint Strategy: Network-First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API GET responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // 2. Navigation Requests Strategy: Network-First with Index Shell Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match('/app/') || caches.match('/app/index.html');
        })
    );
    return;
  }

  // 3. Product & CDN Images Strategy: Cache-First (with background revalidation)
  const isImage = request.destination === 'image' || 
                  url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)/i) ||
                  url.hostname.includes('cloudinary.com') ||
                  url.hostname.includes('unsplash.com');

  if (isImage) {
    event.respondWith(
      caches.open('loopers-images-cache').then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Fetch in background to update cache in case image has changed
            fetch(request).then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse);
              }
            }).catch(() => {});
            return cachedResponse;
          }
          return fetch(request).then((networkResponse) => {
            // Allow caching standard success responses, as well as opaque (status 0) cross-origin assets
            if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 4. Static Assets Strategy: Stale-While-Revalidate / Cache-First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to revalidate cache
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => { });
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        }
        return networkResponse;
      });
    })
  );
});

// 5. Web Push Notifications Listener
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('[Service Worker] Push event received with no payload.');
    return;
  }

  try {
    const data = event.data.json();
    const targetUrl = data.url || (data.orderId ? `/tracking/${data.orderId}` : '/orders');

    const options = {
      body: data.body,
      icon: data.icon || '/pwa-192x192.png',
      badge: data.badge || '/pwa-192x192.png',
      tag: data.orderId ? `order-${data.orderId}-${data.type || 'status'}` : 'loopers-notification',
      data: {
        orderId: data.orderId,
        url: targetUrl,
        type: data.type
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Loopers', options)
    );
  } catch (err) {
    console.error('[Service Worker] Error displaying push notification:', err);
  }
});

// 6. Web Push Notification Click Handler (Deep Linking)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  let relativeUrl = event.notification.data?.url || '/orders';
  if (!relativeUrl.startsWith('/app')) {
    relativeUrl = '/app' + (relativeUrl.startsWith('/') ? relativeUrl : '/' + relativeUrl);
  }
  const targetUrl = new URL(relativeUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Look for an existing open tab/window of the application
      for (const client of windowClients) {
        if ('focus' in client) {
          // If already matches origin scope, focus it and redirect
          const clientUrl = new URL(client.url, self.location.origin);
          if (clientUrl.origin === self.location.origin) {
            return client.focus().then((focusedClient) => {
              if (focusedClient && 'navigate' in focusedClient) {
                return focusedClient.navigate(targetUrl);
              }
            });
          }
        }
      }

      // If no active window is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
