const CACHE = 'tpdb-v6';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

function networkFirst(request, fallbackUrl) {
  return fetch(request).then(r => {
    if (r && r.ok) {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(fallbackUrl || request, copy));
    }
    return r;
  }).catch(() => caches.match(fallbackUrl || request));
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isNavigate = e.request.mode === 'navigate';
  const isHtml = url.pathname.endsWith('.html') || url.pathname.endsWith('/tpdb/') || url.pathname.endsWith('/tpdb');
  const isImage = e.request.destination === 'image' || /\/images\//.test(url.pathname);

  if (isNavigate) {
    e.respondWith(networkFirst(e.request, './index.html'));
  } else if (isHtml || isImage) {
    e.respondWith(networkFirst(e.request));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
