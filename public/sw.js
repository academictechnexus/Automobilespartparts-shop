/* AutoSpares Pro Service Worker — Offline First */
const CACHE_NAME = 'autospares-v1';
const OFFLINE_QUEUE_KEY = 'sw_offline_queue';

// Assets to cache for offline use
const STATIC_ASSETS = ['/', '/index.html', '/static/js/main.chunk.js', '/static/js/bundle.js'];

// ─── INSTALL: cache static assets ────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {}); // don't fail if some miss
    })
  );
  self.skipWaiting();
});

// ─── ACTIVATE: clean old caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── FETCH: network first, fallback to cache ─────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET and Supabase API calls
  if (request.method !== 'GET' || request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback
        return caches.match(request).then(cached => {
          if (cached) return cached;
          // Return offline page for navigation
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// ─── BACKGROUND SYNC ─────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_REQUESTED' });
  });
}

// ─── PUSH NOTIFICATIONS ──────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'AutoSpares Pro', {
      body: data.body || 'You have a new notification',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

// ─── PERIODIC BACKGROUND SYNC (for backup reminder) ─────────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-backup-reminder') {
    event.waitUntil(sendBackupReminder());
  }
});

async function sendBackupReminder() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => client.postMessage({ type: 'BACKUP_REMINDER' }));
}
