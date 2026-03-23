// UniServe Service Worker — caches shell, handles background push
const CACHE_NAME = 'uniserve-v2';
const SHELL = ['/', '/index.html'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(SHELL)));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ));
    self.clients.claim();
});

// Network-first for API, cache-first for assets
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads')) return;
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});

// Show notification when push event received (background)
self.addEventListener('push', (e) => {
    const data = e.data?.json() || { title: 'UniServe', body: 'You have a new notification' };
    e.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icons.svg',
            badge: '/icons.svg',
            data: { url: data.url || '/' },
            vibrate: [200, 100, 200],
        })
    );
});

// Open the app when notification is clicked
self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    const url = e.notification.data?.url || '/';
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            const existing = windowClients.find(c => c.url.includes(self.location.origin));
            if (existing) return existing.focus();
            return clients.openWindow(url);
        })
    );
});
