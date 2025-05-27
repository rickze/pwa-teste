const CACHE_NAME = 'pwa-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './html5-qrcode.min.js',
  './manifest.json',
  './icon-192.png',
  './screenshot1.png'
];

// Instalação: guarda recursos offline
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch: garante funcionamento offline completo
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Activate: limpa caches antigas quando atualizares a versão
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.filter(cache => cache !== CACHE_NAME)
          .map(cache => caches.delete(cache))
      )
    )
  );
});