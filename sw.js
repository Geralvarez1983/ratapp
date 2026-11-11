// RatApp service worker: deja la app disponible sin señal (salvo leer el ticket y compartir).
const CACHE = 'ratapp-v1';
const SHELL = ['/', '/index.html', '/firebase-config.js', '/manifest.webmanifest',
  '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png', '/icons/favicon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;
  // Firebase SDK y fuentes: primero caché
  if (url.origin !== location.origin) {
    if (/gstatic\.com|googleapis\.com/.test(url.host) && !/firestore|identitytoolkit|securetoken/.test(url.host)) {
      e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })));
    }
    return;
  }
  // Archivos propios: primero red (para recibir actualizaciones), si no hay señal, caché
  e.respondWith(fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })
    .catch(() => caches.match(req).then(r => r || caches.match('/index.html'))));
});
