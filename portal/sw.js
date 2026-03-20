// Cherrywood Portal Service Worker
// Keeps the app installable — no offline caching so data is always fresh

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
self.addEventListener('fetch', event => event.respondWith(fetch(event.request)));
