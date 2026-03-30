const ASSET_CACHE_NAME = "drum-machine-assets-v1";
const CACHED_DESTINATIONS = new Set(["audio", "font", "image", "script", "style"]);

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((cacheKey) => cacheKey !== ASSET_CACHE_NAME)
          .map((cacheKey) => caches.delete(cacheKey)),
      );
      await self.clients.claim();
    })(),
  );
});

async function fetchAndCache(request, cache) {
  const response = await fetch(request);

  if (response.ok) {
    await cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  if (
    requestUrl.origin !== self.location.origin ||
    !CACHED_DESTINATIONS.has(request.destination)
  ) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(ASSET_CACHE_NAME);
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        event.waitUntil(fetchAndCache(request, cache));
        return cachedResponse;
      }

      return fetchAndCache(request, cache);
    })(),
  );
});
