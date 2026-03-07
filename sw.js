const CACHE_NAME = "riniser v11";
const FILES = [
  "./",
  "./reniser.js",
  "./favicon.ico",
  "./icon-192.png",
  "./icon-512.png"
  "./index.html",
  "./manifest.json",
  "./sw.js",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

