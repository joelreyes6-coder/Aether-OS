import {
  ScramjetServiceWorker,
  setConfig,
  loadCodecs,
} from "/scramjet.bundle.js";

const scramjet = new ScramjetServiceWorker();

let initializedConfig = null;

async function ensureScramjetConfig() {
  if (!scramjet.config) {
    await scramjet.loadConfig();
  }

  if (!scramjet.config) {
    return false;
  }

  if (initializedConfig !== scramjet.config) {
    setConfig(scramjet.config);
    await loadCodecs();
    initializedConfig = scramjet.config;
  }

  return true;
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