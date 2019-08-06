import version from "consts:version";
import resourceList from "resource-list:";
// Give TypeScript the correct global.
declare var self: ServiceWorkerGlobalScope;

const staticCache = `static-${version}`;
const expectedCaches = [staticCache];

self.addEventListener("install", event => {
  const resourcesToCache = resourceList.filter(
    item =>
      item !== "sw.js" &&
      item !== "bootstrap.js" &&
      item !== "_headers" &&
      !item.includes("manifest-") &&
      !item.includes("_redirects-") &&
      !item.includes("icon-") &&
      !item.includes("assetlinks-") &&
      !item.includes("social-")
  );
  const toCache = ["/", ...resourcesToCache];

  event.waitUntil(
    (async function() {
      const cache = await caches.open(staticCache);
      await cache.addAll(toCache);
    })()
  );
});

self.addEventListener("activate", event => {
  self.clients.claim();

  event.waitUntil(
    (async function() {
      // Remove old caches.
      const promises = (await caches.keys()).map(cacheName => {
        if (!expectedCaches.includes(cacheName)) {
          return caches.delete(cacheName);
        }
      });

      await Promise.all<any>(promises);
    })()
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }
  event.respondWith(
    (async function() {
      const cachedResponse = await caches.match(event.request, {
        ignoreSearch: true
      });
      return cachedResponse || fetch(event.request);
    })()
  );
});

self.addEventListener("message", event => {
  switch (event.data) {
    case "skip-waiting":
      self.skipWaiting();
      break;
  }
});
