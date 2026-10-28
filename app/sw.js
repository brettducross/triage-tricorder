const CACHE_NAME = 'triage-tricorder-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './src/theme-config.js',
  './src/native-bridge.js',
  './src/sensors.js',
  './src/triage-engine.js',
  './src/labs.js',
  './src/hud-visuals.js',
  './src/app.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
