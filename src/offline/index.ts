import { noSw } from "../utils/constants";

/** Tell the service worker to skip waiting. Resolves once the controller has changed. */
export async function skipWaiting() {
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg || !reg.waiting) {
    return;
  }
  reg.waiting.postMessage("skip-waiting");

  return new Promise(resolve => {
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => resolve(),
      { once: true }
    );
  });
}

/** Is there currently a waiting worker? */
export let updateReady = false;

/** Wait for an installing worker */
async function installingWorker(
  reg: ServiceWorkerRegistration
): Promise<ServiceWorker> {
  if (reg.installing) {
    return reg.installing;
  }
  return new Promise<ServiceWorker>(resolve => {
    reg.addEventListener("updatefound", () => resolve(reg.installing!), {
      once: true
    });
  });
}

async function watchForUpdate() {
  const hasController = !!navigator.serviceWorker.controller;

  // If we don't have a controller, we don't need to check for updates – we've just loaded from the
  // network.
  if (!hasController) {
    return;
  }

  const reg = await navigator.serviceWorker.getRegistration();
  // Service worker not registered yet.
  if (!reg) {
    return;
  }

  // Look for updates
  if (reg.waiting) {
    return;
  }
  const installing = await installingWorker(reg);
  await new Promise<void>(resolve => {
    installing.addEventListener("statechange", () => {
      if (installing.state === "installed") {
        resolve();
      }
    });
  });

  updateReady = true;
}

/** Set up the service worker and monitor changes */
export async function init() {
  if (noSw) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.unregister();
      location.reload();
    }
    return;
  }

  await navigator.serviceWorker.register("/sw.js");
  watchForUpdate();
}
