import {
  ScramjetServiceWorker,
  setConfig,
  loadCodecs,
} from "/scramjet.bundle.js";

const scramjet = new ScramjetServiceWorker();

let initializedConfig = null;
let configReadyPromise = null;

async function ensureScramjetConfig() {
  if (scramjet.config) {
    if (initializedConfig !== scramjet.config) {
      setConfig(scramjet.config);
      await loadCodecs();
      initializedConfig = scramjet.config;
    }

    return true;
  }

  if (!configReadyPromise) {
    configReadyPromise = (async () => {
      try {
        await scramjet.loadConfig();

        if (!scramjet.config) {
          return false;
        }

        setConfig(scramjet.config);
        await loadCodecs();

        initializedConfig = scramjet.config;

        return true;
      } catch (error) {
        console.error(
          "Scramjet service worker config failed:",
          error
        );

        return false;
      }
    })();
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