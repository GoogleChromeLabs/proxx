import { version } from "consts:";
import resourceList from "resource-list:";
// Give TypeScript the correct global.
declare var self: ServiceWorkerGlobalScope;

const staticCache = `static-${version}`;

self.addEventListener("install", event => {
  const toCache = resourceList.filter(item => item !== "sw.js");

  event.waitUntil(
    (async function() {
      const cache = await caches.open(staticCache);
      await cache.addAll(toCache);
    })()
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async function() {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        if (cacheName === staticCache) {
          continue;
        }
        await caches.delete(cacheName);
      }
    })()
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }
  event.respondWith(
    (async function() {
      const cachedResponse = await caches.match(event.request);
      return cachedResponse || fetch(event.request);
    })()
  );
});
