// Minimal pass-through service worker. No caching/offline strategy — it exists
// only so browsers' installability heuristics (e.g. Chrome's
// `beforeinstallprompt`) recognize the site as installable.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Intentionally not intercepted — requests pass straight through to the network.
});
