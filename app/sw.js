const CACHE_NAME = 'triage-tricorder-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './src/native-bridge.js',
  './src/sensors.js',
  './src/triage-engine.js',
  './src/labs.js',
  './src/hud-visuals.js',
  './src/app.js',
  './icons/icon.svg'
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
