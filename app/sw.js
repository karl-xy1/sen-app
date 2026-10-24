// Service worker: cho Sen mở được khi mất mạng. Không đụng tới dữ liệu người dùng.
const CACHE = 'sen-app-v3';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/intro.js', 'js/main.js', 'js/store.js', 'js/engine.js', 'js/content.js', 'js/ui.js', 'js/views-core.js', 'js/views-more.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Mạng trước, bộ nhớ đệm khi offline — để bản cập nhật luôn tới người dùng.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Video đoạn mở đầu đi thẳng ra mạng: trình duyệt tải video theo từng đoạn (Range), bộ đệm không giữ được,
  // và Safari trên iPhone không phát video lấy từ bộ đệm. Mất mạng thì js/intro.js tự bỏ qua đoạn mở đầu.
  if (e.request.destination === 'video' || e.request.url.endsWith('.mp4')) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && (new URL(e.request.url).origin === location.origin || e.request.url.includes('fonts.g'))) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('index.html')))
  );
});
