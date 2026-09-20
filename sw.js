const CACHE = "riniser-v4";
const FILES = ["./", "./index.html", "./style.css", "./riniser.js", "./manifest.json"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
