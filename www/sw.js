/* NIGHTWARD : moteur hors-ligne de l'application.
   Stratégie : on essaie toujours le réseau d'abord (tu vois donc tes modifications tout de suite),
   et si le téléphone n'a plus de connexion, on affiche la dernière version enregistrée. */
const CACHE = 'nightward-v1';
const CORE = ['./', 'index.html', 'style.css', 'script.js', 'logo.png', 'manifest.json',
              'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || req.headers.has('range') || /\.mp3$/i.test(url.pathname)) return;   // la musique reste en ligne
  const fonts = /(^|\.)(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== location.origin && !fonts) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
