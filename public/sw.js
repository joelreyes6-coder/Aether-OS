import {
  ScramjetServiceWorker,
  setConfig,
  loadCodecs,
} from "/scramjet.bundle.js";

const scramjet = new ScramjetServiceWorker();

let initializedConfig = null;
let configReadyPromise = null;

async function ensureScramjetConfig() {
  if (
    scramjet.config &&
    initializedConfig === scramjet.config
  ) {
    return true;
  }

  if (!configReadyPromise) {
    configReadyPromise = (async () => {
      try {
        if (!scramjet.config) {
          await scramjet.loadConfig();
        }

        if (!scramjet.config) {
          return false;
        }

        const config = scramjet.config;

        setConfig(config);

        await loadCodecs();

        initializedConfig = config;

        return true;
      } catch (error) {
        console.error(
          "Scramjet service worker config failed:",
          error
        );

        return false;
      }
    })().finally(() => {
      // Share concurrent attempts, but allow
      // later requests to retry after a failure.
      configReadyPromise = null;
    });
  }

  return configReadyPromise;
}

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      const ready = await ensureScramjetConfig();

      if (!ready) {
        return fetch(event.request);
      }

      if (scramjet.route(event)) {
        return scramjet.fetch(event);
      }

      return fetch(event.request);
    })()
  );
});